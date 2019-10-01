from django import template
from django.conf import settings
from django.template import Template

from pathlib import Path

register = template.Library()


@register.simple_tag(takes_context=True)
def static_no_cache(context, url):
    path = Path("." + settings.STATIC_URL + url)
    print(str(path) + "?modified=" + str(path.stat().st_mtime))
    if path.exists():
        return Template(settings.STATIC_URL + url + "?version=" + str(path.stat().st_mtime)).render(context)
    else:
        return Template(settings.STATIC_URL + url).render(context)
