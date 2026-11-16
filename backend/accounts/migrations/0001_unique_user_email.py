from collections import defaultdict

from django.db import migrations


def check_existing_emails(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    database = schema_editor.connection.alias
    emails_by_normalized_value = defaultdict(list)

    for user_id, email in User.objects.using(database).values_list('id', 'email').iterator():
        normalized_email = (email or '').strip().casefold()
        emails_by_normalized_value[normalized_email].append(user_id)

    if any(len(user_ids) > 1 for user_ids in emails_by_normalized_value.values()):
        raise RuntimeError(
            'Duplicate user email addresses must be resolved before applying '
            'the accounts email uniqueness migration.'
        )


def drop_email_index(apps, schema_editor):
    if schema_editor.connection.vendor == 'mysql':
        schema_editor.execute(
            'DROP INDEX accounts_user_email_uniq_idx ON auth_user'
        )
    else:
        schema_editor.execute(
            'DROP INDEX accounts_user_email_uniq_idx'
        )


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(check_existing_emails, migrations.RunPython.noop),
        migrations.RunSQL(
            sql='CREATE UNIQUE INDEX accounts_user_email_uniq_idx ON auth_user (email)',
            reverse_sql=drop_email_index,
        ),
    ]
