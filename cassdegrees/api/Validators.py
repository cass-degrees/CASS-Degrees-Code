import re

from django.core.exceptions import ValidationError
from django.utils.translation import ugettext as _


class ANUValidator(object):
    def validate(self, password, user=None):
        count = 0
        # Check if password contains alphabetic and numeric characters
        if re.findall('[A-Z]', password):
            count += 1
        if re.findall('[a-z]', password):
            count += 1
        if re.findall('[0-9]', password):
            count += 1
        # Check if password contains punctuation
        if re.findall('[$!%^(){}[\];:<>?]', password):
            count += 1
        # Check if password contains unicode characters not in the previous classes
        if re.findall('[^a-zA-Z0-9$!%^(){}[\];:<>?]', "".join(re.findall('[\u0000-\u007F]+', password))):
            count += 1

        if count < 3:
            raise ValidationError(
                _("The password must contain at least 3 of the following classes: \
                lowercase characters, uppercase characters, digits, punctuation, unicode characters"),
                code='password_anu_fail',
            )

    def get_help_text(self):
        return _(
            "The password must contain at least 3 of the following classes: \
            lowercase characters, uppercase characters, digits, punctuation, unicode characters"
        )
