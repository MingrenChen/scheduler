Vue.component('search', {
    template: '<div class="searchdiv">' +
        '<input type="text" class="form-control" placeholder="Username" id="searchInput" list="courses">' +
        '<datalist id="courses">' +
        '<option v-for="course in this.candidateCourses" :value="course"></option>' +
        '</datalist>'+
        '</div>',

    data: function () {
        return {}
    },

});

var timetable = new Vue({
    el: '#searchArea',
    data: {
        candidateCourses: ['csc108', 'csc207']
    },
    methods: {

    },
})

