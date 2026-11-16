from datetime import datetime, time, timedelta

from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

from tasks.models import Task


class Command(BaseCommand):
    help = 'Email users about their tasks due tomorrow.'

    def handle(self, *args, **options):
        tomorrow = timezone.localdate() + timedelta(days=1)
        current_timezone = timezone.get_current_timezone()
        start = timezone.make_aware(
            datetime.combine(tomorrow, time.min),
            current_timezone
        )
        end = timezone.make_aware(
            datetime.combine(tomorrow + timedelta(days=1), time.min),
            current_timezone
        )
        tasks = Task.objects.filter(
            due_date__gte=start,
            due_date__lt=end,
            reminder_sent_at__isnull=True
        ).exclude(status=Task.Status.DONE).select_related('user')

        sent = 0
        for task in tasks:
            if not task.user.email:
                continue
            send_mail(
                subject=f'Task due tomorrow: {task.title}',
                message=(
                    f'Hi {task.user.first_name or task.user.username},\n\n'
                    f'"{task.title}" is due tomorrow.'
                ),
                from_email=None,
                recipient_list=[task.user.email],
                fail_silently=False
            )
            task.reminder_sent_at = timezone.now()
            task.save(update_fields=['reminder_sent_at'])
            sent += 1

        self.stdout.write(self.style.SUCCESS(f'Sent {sent} task reminder(s).'))
