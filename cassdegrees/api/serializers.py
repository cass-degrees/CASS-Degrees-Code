from .models import *
from rest_framework import serializers


# Serialise the contents of the 'Sample' model with fields 'id' and 'text'
class SampleSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = SampleModel
        fields = ('id', 'text')


class CourseSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = CourseModel
        fields = ('id', 'code', 'year', 'name', 'units', 'offeredSem1', 'offeredSem2')


class SubplanSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = SubplanModel
        fields = ('id', 'code', 'year', 'name', 'units', 'planType')


class CourseIDSerializer(serializers.PrimaryKeyRelatedField):
    class Meta:
        model = CourseModel
        fields = ['id', 'code']
        many = True
        read_only = False
        queryset = CourseModel.objects.all()


class SubplanIDSerializer(serializers.PrimaryKeyRelatedField):
    class Meta:
        model = SubplanModel
        fields = ['id', 'code']
        many = True
        read_only = False
        queryset = SubplanModel.objects.all()


class CoursesInSubplanSerializer(serializers.HyperlinkedModelSerializer):
    courseId = CourseIDSerializer(queryset=CourseModel.objects.all())
    subplanId = SubplanIDSerializer(queryset=SubplanModel.objects.all())

    class Meta:
        model = CoursesInSubplanModel
        fields = ('id', 'courseId', 'subplanId')


class DegreeSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = DegreeModel
        fields = ('id', 'code', 'year', 'name', 'units', 'degreeType')
