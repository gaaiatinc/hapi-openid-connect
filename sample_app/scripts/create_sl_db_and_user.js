let db = db.getSiblingDB("sa_db");

db.runCommand({
    dropAllUsersFromDatabase: 1,
    writeConcern: {
        w: "majority"
    }
});

db.dropDatabase();

db.createUser({
    user: "sa_db_user",
    pwd: "dev_user_pwd",
    roles: [{
        role: "readWrite",
        db: "sa_db"
    }]
});
