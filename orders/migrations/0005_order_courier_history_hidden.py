from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0004_order_location"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="courier_history_hidden",
            field=models.BooleanField(default=False),
        ),
    ]
