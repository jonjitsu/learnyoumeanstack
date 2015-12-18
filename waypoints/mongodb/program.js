var argv = process.argv,
    mongo = require('mongodb').MongoClient,
    URL_NO_DB = 'mongodb://localhost:27017/'
    URL = URL_NO_DB + 'learnyoumongo'
;

function p3Find(age) {
    mongo.connect(URL, function(err, db) {
        if(err) throw err;
        db
            .collection('parrots')
            //.find()
             .find({
                 age: {$gt: age}
            })
            .toArray(function(err, parrots) {
                if (err) throw err;
                console.log(parrots);
                db.close();
            });
    });
}

// p3Find(parseInt(argv[2], 10));


function withDb(fn, dbName) {
    var url = URL_NO_DB + (dbName || 'learnyoumongo')
    mongo.connect(URL, function(err, db) {
        var done = function() { db.close(); };

        if(err) throw err;
        fn(db, done);
    });
}
function withParrotsCollection(fn) {
    withDb(function(db, done) {
        fn(db.collection('parrots'), done);
    });
}

function p4FindProject(age) {
    withParrotsCollection(function(parrots, done) {
        parrots
            .find({
                age: {$gt: age}
            }, { _id: 0 })
            .toArray(function(err, docs) {
                if(err) throw err;
                console.log(docs);
                done();
            });
    })
}

//p4FindProject(parseInt(argv[2], 10));


function p5Insert(firstname, lastname) {
    withDb(function(db, done) {
        var data ={firstName: firstname, lastName: lastname};
        db
            .collection('docs')
            .insert(data, function(err, d) {
                console.log(JSON.stringify(data));
                db.close();
            })
    });
}
//p5Insert(argv[2], argv[3]);


function p6Update(dbName) {
    withDb(function(db, done) {
        db
            .collection('users')
            .update({
                name: "Tina"
            }, {
                $set: {
                    age: 40
                }
            }, function(err, data) {
                if(err) throw err;
                done();
            })
    }, dbName);
}
//p6Update(argv[2]);

function p7Remove(dbName, cName, id) {
    mongo.connect(URL_NO_DB + dbName, function(err, db) {
        if(err) throw err;
        
        db
            .collection(cName)
            .remove({
                _id: id
            }, function(err, data) {
                if(err) throw err;
                db.close();
            });
    });
}
//p7Remove(argv[2], argv[3], argv[4]);


function p8Count(age) {
    withDb(function(db, done) {
        db
            .collection('parrots')
            .count({ age: {$gt: age}}, function(err, count) {
                console.log(count);
                done();
            });
    });
}
//p8Count(parseInt(argv[2])); 

function p9Aggregate(size) {
    withDb(function(db, done) {
        db
            .collection('prices')
            .aggregate([{
                $match: { size: size } 
            }, {
                $group: {
                    _id: null,
                    avgPrice: { $avg: '$price' }}
            }])
            .toArray(function(err, results) {
                if(err) throw err;

                //                console.log(results.price.toFixed(2));
                console.log(results[0].avgPrice.toFixed(2));
                done();
            })
    });
}

p9Aggregate(argv[2]);
