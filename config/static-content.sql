# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: localhost (MySQL 5.7.21)
# Database: eoe
# Generation Time: 2018-10-01 13:38:50 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table building
# ------------------------------------------------------------

LOCK TABLES `building` WRITE;
/*!40000 ALTER TABLE `building` DISABLE KEYS */;

INSERT INTO `building` (`id`, `name`)
VALUES
	(1,'Castle'),
	(2,'Barracks'),
	(3,'Lumber Mill'),
	(4,'Mine'),
	(5,'Port'),
	(6,'Road'),
	(7,'Bastion');

/*!40000 ALTER TABLE `building` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table terrain
# ------------------------------------------------------------

LOCK TABLES `terrain` WRITE;
/*!40000 ALTER TABLE `terrain` DISABLE KEYS */;

INSERT INTO `terrain` (`id`, `name`, `base_tide_cost`, `base_supply_output`)
VALUES
	(1,'Plains',10,10),
	(2,'Hills',15,10),
	(3,'Mountains',1000,20),
	(4,'Forest',1000,20),
	(5,'Sea',50,0),
	(6,'Swamp',30,0);

/*!40000 ALTER TABLE `terrain` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
