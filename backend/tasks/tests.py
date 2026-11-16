from datetime import timedelta

from django.core import mail
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Subtask, Task


class TaskUrlTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_patch_with_trailing_slash_requires_authentication(self):
        response = self.client.patch('/api/tasks/1/',{},format='json')
        self.assertEqual(response.status_code, 401)

    def test_patch_without_trailing_slash_redirects(self):
        response = self.client.patch('/api/tasks/1',{},format='json')
        self.assertEqual(response.status_code, 301)


class TaskFeatureTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username='owner@example.com',
            email='owner@example.com',
            password='SecurePass123!'
        )
        self.other_user = user_model.objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='SecurePass123!'
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_dashboard_endpoint_remains_available(self):
        response = self.client.get('/api/tasks/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_tasks'], 0)

    def test_priority_ordering_uses_high_medium_low_order(self):
        for priority in (Task.Priority.LOW, Task.Priority.HIGH, Task.Priority.MEDIUM):
            Task.objects.create(
                user=self.user,
                title=f'{priority} task',
                priority=priority
            )

        response = self.client.get('/api/tasks/?ordering=priority')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [task['priority'] for task in response.data['results']],
            [Task.Priority.HIGH, Task.Priority.MEDIUM, Task.Priority.LOW]
        )

    def test_reverse_priority_ordering_uses_low_medium_high_order(self):
        for priority in (Task.Priority.HIGH, Task.Priority.LOW, Task.Priority.MEDIUM):
            Task.objects.create(
                user=self.user,
                title=f'{priority} task',
                priority=priority
            )

        response = self.client.get('/api/tasks/?ordering=-priority')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [task['priority'] for task in response.data['results']],
            [Task.Priority.LOW, Task.Priority.MEDIUM, Task.Priority.HIGH]
        )

    def test_checklist_items_can_be_created_and_updated(self):
        task = Task.objects.create(user=self.user, title='Plan feature')
        response = self.client.post(
            f'/api/tasks/{task.id}/subtasks/',
            {'title': 'Write tests'},
            format='json'
        )
        self.assertEqual(response.status_code, 201)
        subtask_id = response.data['id']

        response = self.client.patch(
            f'/api/tasks/{task.id}/subtasks/{subtask_id}/',
            {'is_completed': True},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['is_completed'])

    def test_checklist_items_are_scoped_to_the_task_owner(self):
        task = Task.objects.create(user=self.other_user, title='Private task')
        response = self.client.post(
            f'/api/tasks/{task.id}/subtasks/',
            {'title': 'Should not be created'},
            format='json'
        )
        self.assertEqual(response.status_code, 404)
        self.assertFalse(Subtask.objects.exists())

    def test_completing_daily_task_creates_next_occurrence(self):
        task = Task.objects.create(
            user=self.user,
            title='Daily task',
            due_date=timezone.now() + timedelta(days=1),
            recurrence=Task.Recurrence.DAILY
        )
        response = self.client.patch(
            f'/api/tasks/{task.id}/',
            {'status': Task.Status.DONE},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        next_task = Task.objects.get(recurrence_parent=task)
        self.assertEqual(next_task.status, Task.Status.TODO)
        self.assertEqual(next_task.recurrence, Task.Recurrence.DAILY)

    def test_recompleting_task_does_not_duplicate_same_occurrence(self):
        task = Task.objects.create(
            user=self.user,
            title='Daily task',
            due_date=timezone.now() + timedelta(days=1),
            recurrence=Task.Recurrence.DAILY
        )
        task_url = f'/api/tasks/{task.id}/'
        self.client.patch(task_url, {'status': Task.Status.DONE}, format='json')
        self.client.patch(task_url, {'status': Task.Status.TODO}, format='json')
        self.client.patch(task_url, {'status': Task.Status.DONE}, format='json')

        self.assertEqual(Task.objects.filter(recurrence_parent=task).count(), 1)

    def test_recompleting_recurring_task_without_due_date_stays_idempotent(self):
        task = Task.objects.create(
            user=self.user,
            title='Unscheduled daily task',
            recurrence=Task.Recurrence.DAILY
        )
        task_url = f'/api/tasks/{task.id}/'
        self.client.patch(task_url, {'status': Task.Status.DONE}, format='json')
        self.client.patch(task_url, {'status': Task.Status.TODO}, format='json')
        self.client.patch(task_url, {'status': Task.Status.DONE}, format='json')

        self.assertEqual(Task.objects.filter(recurrence_parent=task).count(), 1)

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
    def test_reminder_command_emails_due_tomorrow_tasks_only_once(self):
        tomorrow = timezone.localdate() + timedelta(days=1)
        due_tomorrow = timezone.make_aware(
            timezone.datetime.combine(tomorrow, timezone.datetime.min.time())
        )
        task = Task.objects.create(
            user=self.user,
            title='Reminder task',
            due_date=due_tomorrow
        )
        Task.objects.create(
            user=self.user,
            title='Completed task',
            due_date=due_tomorrow,
            status=Task.Status.DONE
        )
        Task.objects.create(
            user=self.user,
            title='Not due tomorrow',
            due_date=due_tomorrow + timedelta(days=1)
        )

        call_command('send_task_reminders')
        self.assertEqual(len(mail.outbox), 1)
        task.refresh_from_db()
        self.assertIsNotNone(task.reminder_sent_at)

        call_command('send_task_reminders')
        self.assertEqual(len(mail.outbox), 1)


class LogoutTests(TestCase):
    def test_logout_blacklists_the_refresh_token(self):
        user = get_user_model().objects.create_user(
            username='logout@example.com',
            email='logout@example.com',
            password='SecurePass123!'
        )
        refresh = RefreshToken.for_user(user)
        response = APIClient().post(
            '/api/auth/logout/',
            {'refresh': str(refresh)},
            format='json'
        )
        self.assertEqual(response.status_code, 205)

        second_response = APIClient().post(
            '/api/auth/logout/',
            {'refresh': str(refresh)},
            format='json'
        )
        self.assertEqual(second_response.status_code, 400)