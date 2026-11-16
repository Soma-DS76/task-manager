from django.contrib import admin

from .models import Category, Subtask, Task


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'name',
        'user',
        'color',
        'created_at'
    )

    search_fields = (
        'name',
        'user__email'
    )

    list_filter = (
        'created_at',
    )

    ordering = (
        'name',
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):

    list_display = ('id','title','user','category','priority','status','due_date','completed_at','created_at')
    search_fields = ('title','description','user__email')
    list_filter = ('status','priority','category','created_at')
    ordering = ('-created_at',)
    readonly_fields = ('completed_at','created_at','updated_at')
    list_per_page = 20


@admin.register(Subtask)
class SubtaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'task', 'is_completed', 'created_at')
    list_filter = ('is_completed', 'created_at')