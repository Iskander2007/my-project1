from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="weight_kg",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=6),
        ),
    ]
