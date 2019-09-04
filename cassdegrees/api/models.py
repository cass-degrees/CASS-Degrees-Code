from django.db import models
import django.contrib.postgres.fields as psql
from django.utils import timezone


class SampleModel(models.Model):
    id = models.CharField(max_length=15, primary_key=True)
    text = models.CharField(max_length=100)


class CourseModel(models.Model):
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=32)
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=256)
    units = models.PositiveIntegerField()
    offeredSem1 = models.BooleanField()
    offeredSem2 = models.BooleanField()
    rules = psql.JSONField(default=list)
    lastUpdated = models.DateField(default=timezone.now)

    class Meta:
        unique_together = (("code", "year"),)


# todo: Add type for elements
class ListModel(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=32)
    year = models.PositiveIntegerField()
    elements = psql.JSONField(default=list)
    lastUpdated = models.DateField(default=timezone.now)

    class Meta:
        unique_together = ("name", "year")


class SubplanModel(models.Model):
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=32)
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=256)
    units = models.PositiveIntegerField()
    lastUpdated = models.DateField(default=timezone.now)
    publish = models.BooleanField(default=False)

    subplanChoices = (("MAJ", "Major"), ("MIN", "Minor"), ("SPEC", "Specialisation"))

    rules = psql.JSONField(default=list)

    planType = models.CharField(max_length=4, choices=subplanChoices)

    class Meta:
        unique_together = (("code", "year"), ("year", "name", "planType"),)


class ProgramModel(models.Model):
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=32)
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=256)
    units = models.PositiveIntegerField()
    lastUpdated = models.DateField(default=timezone.now)
    staffNotes = models.TextField(blank=True, default='')
    studentNotes = models.TextField(blank=True, default='')
    publish = models.BooleanField(default=False)

    degreeChoices = (("ugrad-sing", "Undergraduate Single Pass Degree"),
                     ("ugrad-doub", "Undergraduate Flexible Double Degree"),
                     ("hon", "Honours Degree"),
                     ("mast-sing", "Masters Single Degree"),
                     ("mast-adv", "Masters (Advanced) Degree"),
                     ("mast-doub", "Masters Flexible Double Degree"),
                     ("vert-doub", "Vertical Flexible Double Degree"),
                     ("other", "Other Degree"))

    programType = models.CharField(max_length=10, choices=degreeChoices)

    globalRequirements = psql.JSONField(default=list)
    rules = psql.JSONField(default=list)

    class Meta:
        unique_together = (("code", "year"), ("name", "year"))
