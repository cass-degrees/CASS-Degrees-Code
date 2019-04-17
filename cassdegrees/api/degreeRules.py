import json


class DegreeRules:
    """
    A class which represents degree rules as a k-ary tree and stores them in a list.

    Rules should be created using the rule_ functions, which return a dictionary
    representing the rule. Rules can then be arranged into an expression and parsed
    through the class to build their k-ary tree representation.

    Calling get_rules_as_json will return the built expression as a JSON serialised string
    that can be stored in the database under [degree].[rules].
    """

    def __init__(self, expression_list):
        self.expressionTree = []
        self.build_expression(expression_list)

    def __init__(self):
        self.expressionTree = []

    def build_expression(self, expression_list):
        """
        Calls the parse_tree function and assigns the value as the
        stored tree for this DegreeRules instance.

        :param expression_list: See parse_tree()
        :return: see parse_tree()
        """

        self.expressionTree = self.parse_tree(expression_list)
        return self.expressionTree

    def parse_tree(self, expression_list):
        """
        Accepts a list of tokens that represent a boolean expression of degree rules
        and converts them into a k-ary tree of lists and dictionaries that can be
        stored in JSON format.

        Expressions should be well formed. A well formed expression:
            Has only one operator per "level". (i.e one unique operator per bracketed term)
                BAD: A AND B AND C OR D AND E
                GOOD: (A AND B AND C) OR (D AND E)

        :param expression_list: (list) a list of tokens in the format of a boolean expression.
                                A token must be one of:
                                    "(", ")", "AND", "OR", rule
                                where rule is some dictionary representing a rule, returned from a function below.
        :return: (list) a k-ary tree with rules as leaf nodes, and boolean operators as the other nodes
        """

        tree = [None]
        stack = []
        node = tree
        for token in expression_list:
            if token == "(":
                node.append([None])
                stack.append(node)
                node = node[-1]
            elif token == ")":
                if len(stack) > 0:
                    node = stack.pop()
                else:
                    parent = [None]
                    parent.append(node)
                    node = parent
                    tree = parent
            elif token in ["AND", "OR"]:
                if node[0] is not None and node[0] != token:
                    raise ValueError("Expression is poorly formed. Operators on the same level should be consistent.")

                node[0] = token
                node.append([None])
                stack.append(node)
                node = node[-1]
            else:
                node[0] = token
                if len(stack) > 0:
                    parent = stack.pop()
                    node = parent
                else:
                    parent = [None]
                    parent.append(node)
                    node = parent
                    tree = parent

        tree = self.flatten_tree(tree)

        return tree

    def flatten_tree(self, tree):
        """
        Takes a tree and recursively flattens it so that children without siblings are
        moved up. Children without siblings, by definition, will have no operator, so
        they appear as [null, {rule}]. They are effectively moved up to the next
        applicable rule group by changing them to just {rule}.

        :param tree: the tree to be flattened
        :return: the flattened tree
        """

        while len(tree) == 2:
            tree = tree[1]

        for child in range(len(tree)):
            if isinstance(tree[child], list):
                tree[child] = self.flatten_tree(tree[child])

        return tree

    def append_rule(self, rule):
        """
        Takes a rule that should be independent of the existing rules for a degree
        and appends it to the degree rules with an AND operator.

        :param rule: an expression list that follows the criteria for parse_tree
        """

        rule = self.parse_tree(rule)

        if len(self.expressionTree) == 0:
            raise ValueError("Cannot append rules to an undefined expression. Run build_expression first.")
        elif self.expressionTree[0] == "AND":
            self.expressionTree.append(rule)
        else:
            self.expressionTree = ["AND", self.expressionTree, rule]

    def get_rules_as_json(self):
        """
        :return: a JSON serialised string representing the rules expression tree
        """

        return json.dumps(self.expressionTree)

    """
        DEGREE RULES
            Functions that return dictionary representations of rules
    """

    @staticmethod
    def rule_course_selection(code):
        """
        Creates a rule which lists a single course code which
        must be completed for a degree.

        :param code: (String) the course code
        :return: (Dict) a course selection rule
        """

        rule = {"type": "course selection", "code": code}
        return rule

    @staticmethod
    def rule_subplan_selection(code):
        """
        Creates a rule which lists a single subplan code which
        must be completed for a degree.

        :param code: (String) the subplan code
        :return: (Dict) a subplan selection rule
        """

        rule = {"type": "subplan selection", "code": code}
        return rule

    @staticmethod
    def rule_electives(units):
        """
        Creates a rule which describes a number of units worth
        of elective courses which must be completed for the degree.

        :param units: (Int) number of units of available electives
        :return: (Dict) an elective rule
        """

        rule = {"type": "electives", "units": units}
        return rule

    @staticmethod
    def rule_subject_requirement(subject, level, minimum, units):
        """
        Creates a rule which describes a number of units which must
        be completed, where each course is from a specific subject area
        and of a given level (or potentially above).

        :param subject: (String) a 4 letter course code i.e "ARTS", "COMP" etc.
        :param level: (Int) a number in the range [1000, 2000, ... , 9000]
        :param minimum: (Boolean) true = courses of the level or above count towards the rule,
                                  false = only course equal to the level count towards the rule
        :param units: (Int) number of units that must be completed from the subject area and level
        :return: (Dict) a subject requirement rule
        """

        rule = {"type": "subject requirement", "subject": subject, "level": level, "minimum": minimum, "units": units}
        return rule

    @staticmethod
    def rule_course_limit(subject, level, units):
        """
        Creates a rule which requires that a degree may have no
        more than <units> units worth of courses from a given subject
        and level.

        :param subject: (String) a 4 letter course code i.e "ARTS", "COMP" etc.
        :param level: (Int) a number in the range [1000, 2000, ... , 9000]
        :param units: (Int) maximum number of units of this subject and level that can count to a degree
        :return: (Dict) a subject requirement rule
        """

        rule = {"type": "subject requirement", "subject": subject, "level": level, "units": units}
        return rule
