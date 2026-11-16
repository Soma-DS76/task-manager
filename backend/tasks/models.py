
from django.conf import settings
from django.db import models
from django.core.validators import RegexValidator


class Category(models.Model):
    user = models.ForeignKey( settings.AUTH_USER_MODEL,
                              on_delete=models.CASCADE,
                              related_name='categories')

    name = models.CharField(max_length=100)

    color = models.CharField(
        max_length=7,
        default='#4F46E5',
        validators=[RegexValidator(regex=r'^#[0-9A-Fa-f]{6}$',
                    message='Enter a valid hex color, for example #4F46E5.')])

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        constraints = [models.UniqueConstraint(fields=['user', 'name'],name='unique_category_name_per_user')]

    def __str__(self):
        return f'{self.name} - {self.user.email}'


class Task(models.Model):

    class Priority(models.TextChoices):
        LOW = 'Low', 'Low'
        MEDIUM = 'Medium', 'Medium'
        HIGH = 'High', 'High'

    class Status(models.TextChoices):
        TODO = 'To Do', 'To Do'
        IN_PROGRESS = 'In Progress', 'In Progress'
        DONE = 'Done', 'Done'

    class Recurrence(models.TextChoices):
        NONE = 'none', 'Does not repeat'
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'

    user = models.ForeignKey( settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE,
                             related_name='tasks')

    title = models.CharField(max_length=100)

    description = models.TextField(blank=True)

    category = models.ForeignKey(Category,on_delete=models.SET_NULL,null=True,blank=True,related_name='tasks')

    priority = models.CharField(max_length=10,choices=Priority.choices,default=Priority.MEDIUM)

    status = models.CharField(max_length=20,choices=Status.choices,default=Status.TODO)

    due_date = models.DateTimeField(null=True,blank=True)

    completed_at = models.DateTimeField(null=True,blank=True)

    recurrence = models.CharField(
        max_length=10,
        choices=Recurrence.choices,
        default=Recurrence.NONE
    )

    recurrence_parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='recurrences'
    )

    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['recurrence_parent', 'due_date'],
                name='unique_task_recurrence_occurrence'
            )
        ]

    def __str__(self):
        return f'{self.title} - {self.user.email}'


class Subtask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']

    def __str__(self):
        return f'{self.title} - {self.task.title}'
