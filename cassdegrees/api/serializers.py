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
        fields = ('id', 'code', 'year', 'name', 'units', 'planType', 'courses')


class ProgramSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ProgramModel
        fields = ('id', 'code', 'year', 'name', 'units', 'programType', 'globalRequirements', 'rules')
