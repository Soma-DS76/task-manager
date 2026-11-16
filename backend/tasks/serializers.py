
from rest_framework import serializers

from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from .models import Category, Subtask, Task


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ['id', 'title', 'is_completed', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Subtask title cannot be blank.')
        return value


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = [ 'id','user','name','color','created_at','updated_at']
        read_only_fields = ['id','user','created_at','updated_at']

    def validate_name(self, value):
        value = value.strip()

        user = self.context['request'].user

        queryset = Category.objects.filter(user=user,name__iexact=value)

        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise serializers.ValidationError('You already have a category with this name.')

        return value

    def validate_color(self, value):
        return value.upper()


class TaskSerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = ['id','user','title','description','category',
                  'priority','status','due_date','completed_at','recurrence',
                  'subtasks',
                  'created_at','updated_at']

        read_only_fields = [
            'id', 'user', 'completed_at', 'subtasks', 'created_at', 'updated_at'
        ]

    def validate_title(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError('Title must contain at least 3 characters.')

        if len(value) > 100:
            raise serializers.ValidationError('Title cannot exceed 100 characters.')

        return value

    def validate_category(self, value):
        if value is not None:
            user = self.context['request'].user

            if value.user_id != user.id:
                raise serializers.ValidationError('You can only use your own categories.')

        return value

    def validate_due_date(self, value):
        if value is not None and not self.instance:
            if value < timezone.now():
                raise serializers.ValidationError('Due date cannot be in the past.')

        return value

    @transaction.atomic
    def create(self, validated_data):
        if validated_data.get('status') == Task.Status.DONE:
            validated_data['completed_at'] = timezone.now()

        task = Task.objects.create(**validated_data)
        if task.status == Task.Status.DONE:
            self._create_next_recurrence(task)
        return task

    @transaction.atomic
    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        old_due_date = instance.due_date

        if new_status == Task.Status.DONE and old_status != Task.Status.DONE:
            instance.completed_at = timezone.now()

        elif new_status != Task.Status.DONE:
            instance.completed_at = None

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if instance.due_date != old_due_date:
            instance.reminder_sent_at = None

        instance.save()

        if new_status == Task.Status.DONE and old_status != Task.Status.DONE:
            self._create_next_recurrence(instance)

        return instance

    @staticmethod
    def _create_next_recurrence(task):
        if task.recurrence == Task.Recurrence.NONE:
            return

        if (
            task.due_date is None
            and task.recurrence_parent is None
            and task.recurrences.exists()
        ):
            return

        interval = (
            timedelta(days=1)
            if task.recurrence == Task.Recurrence.DAILY
            else timedelta(weeks=1)
        )
        base_date = task.due_date or timezone.now()
        next_due_date = max(base_date, timezone.now()) + interval
        root_task = task.recurrence_parent or task

        Task.objects.get_or_create(
            recurrence_parent=root_task,
            due_date=next_due_date,
            defaults={
                'user': task.user,
                'title': task.title,
                'description': task.description,
                'category': task.category,
                'priority': task.priority,
                'status': Task.Status.TODO,
                'recurrence': task.recurrence
            }
        )

