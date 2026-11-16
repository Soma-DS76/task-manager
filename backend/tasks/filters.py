from datetime import datetime, time, timedelta

import django_filters
from django.utils import timezone

from .models import Task


class TaskFilter(django_filters.FilterSet):

    due = django_filters.CharFilter(method='filter_due')

    class Meta:
        model = Task
        fields = ['status','priority','category']

    def filter_due(self, queryset, name, value):
        today = timezone.localdate()
        current_timezone = timezone.get_current_timezone()

        start_today = timezone.make_aware(datetime.combine(today, time.min),current_timezone)

        start_tomorrow = timezone.make_aware(datetime.combine(today + timedelta(days=1), time.min),current_timezone)

        if value == 'today':
            return queryset.filter(due_date__gte=start_today,due_date__lt=start_tomorrow)

        if value == 'overdue':
            return queryset.filter(due_date__lt=timezone.now()).exclude(status=Task.Status.DONE)

        if value == 'upcoming':
            return queryset.filter(due_date__gte=start_tomorrow)

        return queryset.none()