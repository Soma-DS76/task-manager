
from datetime import datetime, time, timedelta

from django.db.models import Case, Count, IntegerField, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import TaskFilter
from .models import Category, Subtask, Task
from .serializers import CategorySerializer, SubtaskSerializer, TaskSerializer


class TaskPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TaskOrderingFilter(OrderingFilter):
    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if not ordering:
            return queryset

        priority_order = Case(
            When(priority=Task.Priority.HIGH, then=Value(0)),
            When(priority=Task.Priority.MEDIUM, then=Value(1)),
            When(priority=Task.Priority.LOW, then=Value(2)),
            output_field=IntegerField()
        )
        order_by = []

        for field in ordering:
            descending = field.startswith('-')
            field_name = field[1:] if descending else field
            if field_name == 'priority':
                order_by.append(
                    priority_order.desc() if descending else priority_order.asc()
                )
            else:
                order_by.append(field)

        return queryset.order_by(*order_by)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(
            user=self.request.user
        ).order_by('name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TaskPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, TaskOrderingFilter]

    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Task.objects.filter(
            user=self.request.user
        ).select_related('category', 'user').prefetch_related('subtasks')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'], url_path='toggle-complete')
    def toggle_complete(self, request, pk=None):
        task = self.get_object()

        if task.status == Task.Status.DONE:
            new_status = Task.Status.TODO
        else:
            new_status = Task.Status.DONE

        serializer = self.get_serializer(
            task,
            data={'status': new_status},
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'message': 'Task completion status updated successfully.',
            'task': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        user_tasks = Task.objects.filter(user=request.user)

        today = timezone.localdate()
        current_timezone = timezone.get_current_timezone()

        start_today = timezone.make_aware(
            datetime.combine(today, time.min),
            current_timezone
        )

        start_tomorrow = timezone.make_aware(
            datetime.combine(today + timedelta(days=1), time.min),
            current_timezone
        )

        now = timezone.now()

        due_today_queryset = user_tasks.filter(
            due_date__gte=start_today,
            due_date__lt=start_tomorrow
        ).exclude(
            status=Task.Status.DONE
        ).order_by('due_date')

        overdue_queryset = user_tasks.filter(
            due_date__lt=now
        ).exclude(
            status=Task.Status.DONE
        ).order_by('due_date')

        total_tasks = user_tasks.count()

        todo_tasks = user_tasks.filter(
            status=Task.Status.TODO
        ).count()

        in_progress_tasks = user_tasks.filter(
            status=Task.Status.IN_PROGRESS
        ).count()

        done_tasks = user_tasks.filter(
            status=Task.Status.DONE
        ).count()

        overdue_tasks = overdue_queryset.count()
        due_today_tasks = due_today_queryset.count()

        completion_percentage = (
            round((done_tasks / total_tasks) * 100, 2)
            if total_tasks > 0 else 0
        )

        category_counts = Category.objects.filter(
            user=request.user
        ).annotate(
            task_count=Count('tasks')
        ).values(
            'id', 'name', 'color', 'task_count'
        ).order_by('name')

        category_data = list(category_counts)

        uncategorized_count = user_tasks.filter(
            category__isnull=True
        ).count()

        if uncategorized_count > 0:
            category_data.append({
                'id': None,
                'name': 'Uncategorized',
                'color': None,
                'task_count': uncategorized_count
            })

        return Response({
            'total_tasks': total_tasks,
            'todo_tasks': todo_tasks,
            'in_progress_tasks': in_progress_tasks,
            'done_tasks': done_tasks,
            'overdue_tasks': overdue_tasks,
            'due_today_tasks': due_today_tasks,
            'completion_percentage': completion_percentage,
            'category_counts': category_data,
            'tasks_due_today': TaskSerializer(
                due_today_queryset,
                many=True
            ).data,
            'overdue_task_list': TaskSerializer(
                overdue_queryset,
                many=True
            ).data
        }, status=status.HTTP_200_OK)


class TaskSubtaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_task(self, request, task_id):
        return get_object_or_404(Task, id=task_id, user=request.user)

    def get(self, request, task_id):
        task = self.get_task(request, task_id)
        serializer = SubtaskSerializer(task.subtasks.all(), many=True)
        return Response(serializer.data)

    def post(self, request, task_id):
        task = self.get_task(request, task_id)
        serializer = SubtaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskSubtaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_subtask(self, request, task_id, subtask_id):
        return get_object_or_404(
            Subtask,
            id=subtask_id,
            task_id=task_id,
            task__user=request.user
        )

    def patch(self, request, task_id, subtask_id):
        subtask = self.get_subtask(request, task_id, subtask_id)
        serializer = SubtaskSerializer(subtask, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, task_id, subtask_id):
        subtask = self.get_subtask(request, task_id, subtask_id)
        subtask.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
