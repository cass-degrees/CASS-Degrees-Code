from .models import *
from rest_framework import serializers


class CourseSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = CourseModel
        fields = ('id',
                  'code',
                  'name',
                  'units',
                  'offeredYears',
                  'offeredSem1',
                  'offeredSem2',
                  'offeredSummer',
                  'offeredAutumn',
                  'offeredWinter',
                  'offeredSpring',
                  'otherOffering',
                  'currentlyActive',
                  'rules')


class SubplanSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = SubplanModel
        fields = ('id', 'code', 'year', 'name', 'units', 'planType', 'globalRequirements', 'rules', 'publish')


class ProgramSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ProgramModel
        fields = ('id', 'code', 'year', 'name', 'units', 'programType', 'globalRequirements', 'rules', 'publish',
                  'staffNotes', 'studentNotes')


# TODO: add type for elements? to allow generalisation
class ListSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ListModel
        fields = ('id', 'name', 'year', 'elements')
