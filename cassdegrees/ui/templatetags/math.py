from django import template

register = template.Library()

# https://stackoverflow.com/questions/18350630/multiplication-in-django-template-without-using-manually-created-template-tag
@register.filter
def divide(value, arg):
    return int(int(value) / int(arg))
