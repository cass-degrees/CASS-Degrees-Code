from django.db import models
import django.contrib.postgres.fields as psql


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

    class Meta:
        unique_together = (("code", "year"),)


class CoursesInSubplanModel(models.Model):
    subplanId = models.ForeignKey('SubplanModel', on_delete=models.CASCADE)
    courseId = models.ForeignKey('CourseModel', on_delete=models.CASCADE)

    class Meta:
        unique_together = (("subplanId", "courseId"),)


class SubplanModel(models.Model):
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=32)
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=256)
    units = models.PositiveIntegerField()

    major = "MAJ"
    minor = "MIN"
    specialisation = "SPEC"
    subplanChoices = ((major, "Major"), (minor, "Minor"), (specialisation, "Specialisation"))

    planType = models.CharField(max_length=4, choices=subplanChoices)
    courses = models.ManyToManyField(CourseModel, through=CoursesInSubplanModel)

    class Meta:
        unique_together = (("code", "year"), ("year", "name", "planType"),)


class DegreeModel(models.Model):
    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=32)
    year = models.PositiveIntegerField()
    name = models.CharField(max_length=256)
    units = models.PositiveIntegerField()

    degreeChoices = (("ugrad-sing", "Undergraduate Single Pass Degree"),
                     ("ugrad-doub", "Undergraduate Flexible Double Degree"),
                     ("hon", "Honours Degree"),
                     ("mast-sing", "Masters Single Degree"),
                     ("mast-adv", "Masters (Advanced) Degree"),
                     ("mast-doub", "Masters Flexible Double Degree"),
                     ("vert-doub", "Vertical Flexible Double Degree"),
                     ("other", "Other Degree"))

    degreeType = models.CharField(max_length=10, choices=degreeChoices)

    globalRequirements = psql.JSONField(default=list)
    rules = psql.JSONField(default=list)

    class Meta:
        unique_together = (("code", "year"),)
