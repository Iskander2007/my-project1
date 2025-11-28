from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_order_weight_kg"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="taken_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
