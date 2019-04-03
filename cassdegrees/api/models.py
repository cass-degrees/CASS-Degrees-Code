from django.db import models


class SampleModel(models.Model):
    id = models.CharField(max_length=15, primary_key=True)
    text = models.CharField(max_length=100)
