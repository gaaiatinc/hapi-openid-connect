var db = db.getSiblingDB("sa_db");

db.runCommand({
    dropAllUsersFromDatabase: 1,
    writeConcern: {
        w: "majority"
    }
});

db.dropDatabase();

db.createUser({
    user: "sa_db_user",
    pwd: "sa_db_pwd",
    roles: [{
        role: "readWrite",
        db: "sa_db"
    }]
});


/**
 *
 * @type {Object}
 */
var authorization_request = {
    date_last_updated: new Date()
};
db.authorization_request.insert(authorization_request);



/**
 * authorization_request expiration index:
 */
db.authorization_request.createIndex({"expire_on": 1}, {expireAfterSeconds: 600});

db.authorization_request.remove({});
