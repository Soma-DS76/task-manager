
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    TaskSubtaskDetailView,
    TaskSubtaskListCreateView,
    TaskViewSet,
)

router = DefaultRouter()

router.register('categories', CategoryViewSet, basename='category')
router.register('tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'tasks/<int:task_id>/subtasks/',
        TaskSubtaskListCreateView.as_view(),
        name='task-subtasks'
    ),
    path(
        'tasks/<int:task_id>/subtasks/<int:subtask_id>/',
        TaskSubtaskDetailView.as_view(),
        name='task-subtask-detail'
    ),
]
