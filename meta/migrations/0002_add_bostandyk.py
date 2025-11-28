from django.db import migrations


DISTRICT_NAME = "Бостандыкский район"


def add_district(apps, schema_editor):
    District = apps.get_model("meta", "District")
    District.objects.get_or_create(name=DISTRICT_NAME)


def remove_district(apps, schema_editor):
    District = apps.get_model("meta", "District")
    District.objects.filter(name=DISTRICT_NAME).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("meta", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_district, remove_district),
    ]
