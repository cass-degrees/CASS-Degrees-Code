from django import template
from django.template import Template

register = template.Library()


@register.simple_tag(takes_context=True)
def breadcrumb(context, linked_url, name):
    return Template('&raquo; <a href="' + linked_url + '">' + name + '</a>').render(context)


@register.simple_tag(takes_context=True)
def finalcrumb(context, name):
    return Template("&raquo; " + name).render(context)
