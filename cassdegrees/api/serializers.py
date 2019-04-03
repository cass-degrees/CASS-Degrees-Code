from .models import SampleModel
from rest_framework import serializers


# Serialise the contents of the 'Sample' model with fields 'id' and 'text'
class SampleSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = SampleModel
        fields = ('id', 'text')
