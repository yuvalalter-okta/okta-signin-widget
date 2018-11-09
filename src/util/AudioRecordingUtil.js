define(['vendor/TypingDNA'], function (TypingDNA) {
    var tdna;
    return {
        track: function(selectorId) {
            try {
                tdna = new TypingDNA();
                tdna.addTarget(selectorId);
                tdna.start();
            } catch (e) {
                // Issues in typing should not stop Primary auth.
            }
        },
        getTypingPattern: function() {
            try {
                return tdna.getTypingPattern({
                    type: 1
                });
            } catch(e) {
                return null;
            }
        }
    };
});
