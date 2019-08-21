from .models import *
from rest_framework import serializers


class CourseSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = CourseModel
        fields = ('id', 'code', 'year', 'name', 'units', 'offeredSem1', 'offeredSem2', 'rules')


class SubplanSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = SubplanModel
        fields = ('id', 'code', 'year', 'name', 'units', 'planType', 'rules', 'publish')


class ProgramSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ProgramModel
        fields = ('id', 'code', 'year', 'name', 'units', 'programType', 'globalRequirements', 'rules', 'publish',
                  'staffNotes', 'studentNotes')
