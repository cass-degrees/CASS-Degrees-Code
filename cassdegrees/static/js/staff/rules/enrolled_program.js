Vue.component('rule_program', {
    props: {
        "details": {
            type: Object,

            validator(value) {
                // Ensure that the object has all the attributes we need
                if (!value.hasOwnProperty("program")) {
                    value.program = "";
                }

                return true;
            }
        }
    },
    data: function () {
        return {
            "programs": [],
            "info_msg": INFO_MSGS['program'],

            // Display related warnings if true
            "is_blank": false,

            "redraw": false
        }
    },
    created() {
        // Javascript has the best indirection...
        const rule = this;

        const request = new XMLHttpRequest();

        request.addEventListener("load", () => {
            rule.programs = JSON.parse(request.response);

            rule.check_options();
        });
        request.open("GET", "/api/search/?select=code,name&from=program");
        request.send();
    },
    methods: {
        check_options(is_submission) {
            // Ensure all data has been filled in
            this.is_blank = this.details.program === "";

            return !this.is_blank;
        },
        // https://michaelnthiessen.com/force-re-render/
        do_redraw() {
            this.redraw = true;

            this.$nextTick(() => {
                this.redraw = false;
            });
        }
    },
    template: '#programRuleTemplate'
});
