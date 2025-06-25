ALTER TABLE user ADD FULLTEXT(username, firstname, email, lastname);
-- Compare this snippet from ADD_FULLTEXT.sql:

DELIMITER //

IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.ROUTINES 
    WHERE ROUTINE_NAME = 'search_user' AND ROUTINE_SCHEMA = DATABASE()
) 
THEN
    CREATE PROCEDURE search_user(IN query VARCHAR(180))
    BEGIN
        SELECT * 
        FROM user
        WHERE MATCH(firstname, lastname, username, email) 
        AGAINST(query IN BOOLEAN MODE);
    END;
END IF //

DELIMITER ;

-- Uncomment the following lines to drop the procedure if it exists
-- MODIFY the procedure if it already exists
-- DROP PROCEDURE IF EXISTS search_user;

-- DELIMITER //

-- CREATE PROCEDURE search_user(IN query VARCHAR(180))
-- BEGIN
--     SELECT * FROM user
--     WHERE MATCH(firstname, lastname, username, email) 
--     AGAINST(query IN BOOLEAN MODE);
-- END //

-- DELIMITER ;

-- Uncomment the following lines to drop the procedure if it exists
-- DROP PROCEDURE IF EXISTS search_user;
-- DROP PROCEDURE IF EXISTS search_user;