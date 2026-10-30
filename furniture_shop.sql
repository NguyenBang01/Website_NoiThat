-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: furniture_shop
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `furniture_shop`
--

/*!40000 DROP DATABASE IF EXISTS `furniture_shop`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `furniture_shop` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `furniture_shop`;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã địa chỉ',
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `receiver_name` varchar(150) NOT NULL COMMENT 'Tên người nhận hàng',
  `phone` varchar(20) NOT NULL,
  `province` varchar(100) NOT NULL,
  `district` varchar(100) NOT NULL,
  `ward` varchar(100) NOT NULL,
  `street` varchar(255) NOT NULL,
  `is_default` tinyint(1) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `recipient_name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_addr_user` (`user_id`),
  CONSTRAINT `fk_addr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Địa chỉ giao hàng của khách';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,3,'','0912345678','Ho Chi Minh','Quan 1','Ben Nghe','15 Le Duan',1,'2026-10-09 12:09:16.115','2026-10-09 12:09:16.115','Dia chi co quan'),(2,4,'','0912345678','Ho Chi Minh','Quan 1','Ben Nghe','15 Le Duan',1,'2026-10-09 12:16:08.689','2026-10-09 12:16:08.689','Dia chi co quan'),(3,5,'','0912345678','Ho Chi Minh','Quan 1','Ben Nghe','15 Le Duan',1,'2026-10-09 12:18:24.650','2026-10-09 12:18:24.650','Dia chi co quan'),(4,6,'','0912345678','Ho Chi Minh','Quan 1','Ben Nghe','15 Le Duan',1,'2026-10-09 12:27:45.161','2026-10-09 12:27:45.161','Dia chi co quan'),(5,9,'','0912345678','Ho Chi Minh','Quan 1','Ben Nghe','15 Le Duan',1,'2026-10-17 21:53:27.088','2026-10-17 21:53:27.088','Dia chi co quan'),(6,13,'','0912345678','Ho Chi Minh','Quan 1','Ben Nghe','15 Le Duan',1,'2026-10-22 23:27:55.444','2026-10-22 23:27:55.444','Dia chi co quan'),(7,14,'','0912345678','Ho Chi Minh','Quan 1','Ben Nghe','15 Le Duan',1,'2026-10-22 23:28:10.357','2026-10-22 23:28:10.357','Dia chi co quan'),(8,12,'','0888888888','Thành phố Hồ Chí Minh','Quận 1','Phường Bến Nghé','77 mai ninh',1,'2026-10-22 23:59:45.737','2026-10-22 23:59:45.737','Nguyễn Thành Ngữ'),(9,15,'','0912345678','Ho Chi Minh','Quan 1','Ben Nghe','15 Le Duan',1,'2026-10-23 00:20:41.092','2026-10-23 00:20:41.092','Dia chi co quan'),(10,16,'','0912345678','Ho Chi Minh','Quan 1','Ben Nghe','15 Le Duan',1,'2026-10-23 00:39:32.947','2026-10-23 00:39:32.947','Dia chi co quan'),(11,12,'','0914101418','Thành phố Hồ Chí Minh','Quận 1','Phường Bến Nghé','44 phan huy ích',0,'2026-10-23 09:28:43.603','2026-10-23 09:28:43.603','Nguyễn Thành Ngữ');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banners` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã banner',
  `title` longtext DEFAULT NULL,
  `image` longtext DEFAULT NULL,
  `link_url` varchar(255) DEFAULT NULL COMMENT 'Đường dẫn khi bấm vào banner',
  `position` varchar(50) NOT NULL DEFAULT 'home_slider' COMMENT 'Vị trí hiển thị (home_slider = slider trang chủ)',
  `sort_order` bigint(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `start_at` datetime DEFAULT NULL COMMENT 'Bắt đầu hiển thị',
  `end_at` datetime DEFAULT NULL COMMENT 'Kết thúc hiển thị',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `subtitle` longtext DEFAULT NULL,
  `link` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Banner quảng cáo';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (1,'Bộ Sưu Tập Mùa Thu 2026','/uploads/2026/10/2675ea66eba86b505776ca7e5f9afa7b.webp',NULL,'home_slider',1,0,NULL,NULL,'2026-10-17 21:52:37.000','2026-10-22 13:08:48.991','Không gian sống hiện đại & ấm cúng','/shop'),(2,'Ưu Đãi Nội Thất Phòng Khách','/uploads/2026/10/ee796e2887360036402f581391963b1a.webp',NULL,'home_slider',2,0,NULL,NULL,'2026-10-17 21:52:37.000','2026-10-22 13:04:05.184','Giảm tới 20% cho các dòng Sofa cao cấp','/category/sofa'),(3,'MỖI KHÔNG GIAN MỘT  CHUYỆN RIÊNG ','/uploads/2026/10/2db608abbc7e6dc3a42c0d44a8bdb281.png',NULL,'home_slider',1,1,NULL,NULL,'2026-10-22 13:16:33.205','2026-10-28 14:15:11.515','Không gian sống hiện đại & ấm cúng',NULL),(4,'Không gian sang trọng, hiện đại','/uploads/2026/10/7d2ab7d88f3747484abc8bc88d9d0b63.png',NULL,'home_slider',0,1,NULL,NULL,'2026-10-28 13:15:46.438','2026-10-28 14:53:23.443',NULL,NULL);
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brands` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã thương hiệu',
  `name` varchar(150) NOT NULL,
  `slug` varchar(190) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_brands_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thương hiệu';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'Nhà Gỗ Việt','nha-go-viet',NULL,'2026-10-08 10:42:39.000','2026-10-08 10:42:39.000'),(2,'Home Decor VN','home-decor-vn',NULL,'2026-10-08 10:42:39.000','2026-10-08 10:42:39.000'),(3,'Scandi Living','scandi-living',NULL,'2026-10-08 10:42:39.000','2026-10-08 10:42:39.000');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã dòng trong giỏ',
  `cart_id` bigint(20) unsigned NOT NULL,
  `variant_id` bigint(20) unsigned NOT NULL,
  `quantity` bigint(20) NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cartitem` (`cart_id`,`variant_id`),
  KEY `fk_cart_items_variant` (`variant_id`),
  CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`),
  CONSTRAINT `fk_carts_items` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`),
  CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ci_var` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sản phẩm trong giỏ hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (1,1,15,2,'2026-10-09 12:09:15.399','2026-10-09 12:09:15.399'),(2,2,15,2,'2026-10-09 12:16:08.535','2026-10-09 12:16:08.535'),(19,10,53,1,'2026-10-22 13:28:59.531','2026-10-22 13:28:59.531'),(20,11,36,2,'2026-10-22 23:12:19.085','2026-10-22 23:12:50.324'),(21,12,53,2,'2026-10-22 23:27:55.242','2026-10-22 23:27:55.242'),(24,8,43,1,'2026-10-22 23:41:02.024','2026-10-22 23:41:02.024'),(25,8,52,1,'2026-10-22 23:41:15.595','2026-10-22 23:41:15.595'),(28,11,53,1,'2026-10-23 09:29:01.304','2026-10-23 09:29:01.304'),(33,17,53,1,'2026-10-28 10:39:45.670','2026-10-28 10:39:45.670');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã giỏ hàng',
  `user_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_user` (`user_id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giỏ hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,3,'2026-10-09 12:09:15.394','2026-10-09 12:09:15.394'),(2,4,'2026-10-09 12:16:08.530','2026-10-09 12:16:08.530'),(3,5,'2026-10-09 12:18:24.503','2026-10-09 12:18:24.503'),(4,6,'2026-10-09 12:27:44.961','2026-10-09 12:27:44.961'),(5,7,'2026-10-09 12:34:16.050','2026-10-09 12:34:16.050'),(7,9,'2026-10-17 21:53:27.027','2026-10-17 21:53:27.027'),(8,1,'2026-10-17 22:22:14.222','2026-10-17 22:22:14.222'),(9,10,'2026-10-22 11:49:18.698','2026-10-22 11:49:18.698'),(10,11,'2026-10-22 12:30:16.789','2026-10-22 12:30:16.789'),(11,12,'2026-10-22 23:07:24.564','2026-10-22 23:07:24.564'),(12,13,'2026-10-22 23:27:55.240','2026-10-22 23:27:55.240'),(13,14,'2026-10-22 23:28:10.298','2026-10-22 23:28:10.298'),(14,15,'2026-10-23 00:20:41.039','2026-10-23 00:20:41.039'),(15,16,'2026-10-23 00:39:32.882','2026-10-23 00:39:32.882'),(17,18,'2026-10-28 10:29:41.379','2026-10-28 10:29:41.379');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã danh mục',
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(190) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `sort_order` bigint(20) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_categories_slug` (`slug`),
  KEY `idx_cat_parent` (`parent_id`),
  CONSTRAINT `fk_cat_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'Bàn ăn','ban','/uploads/2026/10/6d8ba8a35455e2718a82ae6177c421cb.png',1,1,'2026-10-08 10:42:39.000','2026-10-14 09:47:32.458'),(2,NULL,'Ghế','ghe','/uploads/2026/10/e77fd25272ce367876c8ac2b2a6ec976.jpg',2,1,'2026-10-08 10:42:39.000','2026-10-15 21:02:13.921'),(3,NULL,'Sofa','sofa','/uploads/2026/10/2675ea66eba86b505776ca7e5f9afa7b.webp',3,1,'2026-10-08 10:42:39.000','2026-10-15 21:02:45.326'),(4,NULL,'Giường','giuong','/uploads/2026/10/0dcc1a489db0673804715f9f8d9d4c55.jpg',4,1,'2026-10-08 10:42:39.000','2026-10-15 21:03:04.415'),(5,NULL,'Tủ & Kệ','tu','/uploads/2026/10/ee796e2887360036402f581391963b1a.webp',5,1,'2026-10-08 10:42:39.000','2026-10-15 21:11:14.989'),(7,NULL,'Đèn','den','/uploads/2026/10/47afd2b09151ac03c279b874f185d759.jpg',7,1,'2026-10-08 10:42:39.000','2026-10-15 21:03:40.318'),(8,NULL,'Đồ trang trí','do-trang-tri','/uploads/2026/10/4de4258832070f7dbc1c5720aed16fb0.jpg',8,1,'2026-10-08 10:42:39.000','2026-10-15 21:12:34.340'),(9,NULL,'Nội thất khác','noi-that-khac','/uploads/2026/10/9384f9c035b99e7665f60553f67b46d5.jpg',9,1,'2026-10-08 10:42:39.000','2026-10-15 21:14:08.729');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contacts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã liên hệ',
  `name` varchar(150) NOT NULL COMMENT 'Tên người gửi',
  `email` longtext DEFAULT NULL,
  `phone` longtext DEFAULT NULL,
  `subject` longtext DEFAULT NULL,
  `message` longtext DEFAULT NULL,
  `status` enum('new','read','replied') NOT NULL DEFAULT 'new' COMMENT 'Trạng thái: new = mới, read = đã đọc, replied = đã trả lời',
  `created_at` datetime(3) DEFAULT NULL,
  `full_name` longtext DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Liên hệ từ khách hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,'','guest@gmail.com',NULL,'Tu van mua hang','Can tu van bo sofa phong khach','new','2026-10-09 12:09:16.179','Nguyen Van Khach',0),(2,'','guest@gmail.com',NULL,'Tu van mua hang','Can tu van bo sofa phong khach','new','2026-10-09 12:16:08.710','Nguyen Van Khach',0),(3,'','guest@gmail.com',NULL,'Tu van mua hang','Can tu van bo sofa phong khach','new','2026-10-09 12:18:24.672','Nguyen Van Khach',0),(4,'','guest@gmail.com',NULL,'Tu van mua hang','Can tu van bo sofa phong khach','new','2026-10-09 12:27:45.189','Nguyen Van Khach',0),(5,'','khachhang@gocnhadep.vn','0931883988','Đăng ký tư vấn thiết kế nội thất','Khách hàng Nguyễn Trọng Bằng (SĐT: 0931883988) yêu cầu tư vấn giải pháp nội thất theo phong cách sống.','new','2026-10-14 15:20:23.209','Nguyễn Trọng Bằng',1),(8,'','guest@gmail.com',NULL,'Tu van mua hang','Can tu van bo sofa phong khach','new','2026-10-17 21:53:27.100','Nguyen Van Khach',0),(9,'','guest@gmail.com',NULL,'Tu van mua hang','Can tu van bo sofa phong khach','new','2026-10-22 23:27:55.455','Nguyen Van Khach',0),(10,'','guest@gmail.com',NULL,'Tu van mua hang','Can tu van bo sofa phong khach','new','2026-10-22 23:28:10.366','Nguyen Van Khach',0),(11,'','guest@gmail.com',NULL,'Tu van mua hang','Can tu van bo sofa phong khach','new','2026-10-23 00:20:41.101','Nguyen Van Khach',0),(12,'','guest@gmail.com',NULL,'Tu van mua hang','Can tu van bo sofa phong khach','new','2026-10-23 00:39:32.957','Nguyen Van Khach',0);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon_usages`
--

DROP TABLE IF EXISTS `coupon_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon_usages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã bản ghi',
  `coupon_id` bigint(20) unsigned NOT NULL COMMENT 'Mã giảm giá đã dùng',
  `user_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Ai đã dùng',
  `order_id` bigint(20) unsigned NOT NULL COMMENT 'Dùng cho đơn hàng nào',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Thời điểm dùng',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cu_order` (`order_id`),
  KEY `idx_cu_coupon_user` (`coupon_id`,`user_id`),
  KEY `fk_cu_user` (`user_id`),
  CONSTRAINT `fk_cu_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cu_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cu_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lượt sử dụng mã giảm giá';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_usages`
--

LOCK TABLES `coupon_usages` WRITE;
/*!40000 ALTER TABLE `coupon_usages` DISABLE KEYS */;
/*!40000 ALTER TABLE `coupon_usages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupons` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã coupon (số thứ tự)',
  `code` varchar(50) NOT NULL,
  `type` enum('percent','fixed') NOT NULL COMMENT 'Loại: percent = giảm theo %, fixed = giảm số tiền cố định',
  `value` decimal(15,0) NOT NULL COMMENT 'Giá trị giảm (10 = 10% hoặc 200000 = 200.000đ tùy loại)',
  `min_order` decimal(15,0) NOT NULL DEFAULT 0 COMMENT 'Giá trị đơn tối thiểu để áp dụng (VNĐ)',
  `usage_limit` bigint(20) DEFAULT 0,
  `used_count` bigint(20) DEFAULT 0,
  `start_at` datetime DEFAULT NULL COMMENT 'Bắt đầu có hiệu lực',
  `end_at` datetime DEFAULT NULL COMMENT 'Hết hạn',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `discount_type` varchar(20) NOT NULL,
  `discount_value` bigint(20) NOT NULL,
  `min_order_amount` bigint(20) DEFAULT 0,
  `max_discount` bigint(20) DEFAULT NULL,
  `start_date` datetime(3) DEFAULT NULL,
  `end_date` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_coupons_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mã giảm giá';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (1,'WELCOME10','percent',10,1000000,500,0,'2026-01-01 00:00:00','2026-12-31 23:59:59',1,'2026-10-08 10:42:39.000','2026-10-08 10:42:39.000',NULL,'percent',10,1000000,NULL,'2026-01-01 00:00:00.000','2026-12-31 23:59:59.000'),(2,'GIAM200K','fixed',200000,2000000,200,0,'2026-01-01 00:00:00','2026-12-31 23:59:59',1,'2026-10-08 10:42:39.000','2026-10-08 10:42:39.000',NULL,'fixed',200000,2000000,NULL,'2026-01-01 00:00:00.000','2026-12-31 23:59:59.000'),(3,'TESTSALE20','percent',0,0,100,0,NULL,NULL,1,'2026-10-09 12:02:52.635','2026-10-09 12:02:52.635',NULL,'percent',20,500000,NULL,NULL,NULL),(4,'SALE10-8821','percent',0,0,100,0,NULL,NULL,1,'2026-10-09 12:09:15.228','2026-10-09 12:09:15.228','Giam gia 10 phan tram','percent',10,100000,500000,NULL,NULL),(5,'SALE10-4514','percent',0,0,100,1,NULL,NULL,1,'2026-10-09 12:16:08.336','2026-10-09 12:16:08.336','Giam gia 10 phan tram','percent',10,100000,500000,NULL,NULL),(6,'SALE10-6468','percent',0,0,100,1,NULL,NULL,1,'2026-10-09 12:18:24.350','2026-10-09 12:18:24.350','Giam gia 10 phan tram','percent',10,100000,500000,NULL,NULL),(7,'SALE10-1730','percent',0,0,100,1,NULL,NULL,1,'2026-10-09 12:27:44.779','2026-10-09 12:27:44.779','Giam gia 10 phan tram','percent',10,100000,500000,NULL,NULL),(8,'SALE10-7806','percent',0,0,100,2,NULL,NULL,1,'2026-10-17 21:53:26.940','2026-10-17 21:53:26.940','Giam gia 10 phan tram','percent',10,100000,500000,NULL,NULL),(9,'SALE10-9754','percent',0,0,100,0,NULL,NULL,1,'2026-10-22 23:27:55.162','2026-10-22 23:27:55.162','Giam gia 10 phan tram','percent',10,100000,500000,NULL,NULL),(10,'SALE10-6824','percent',0,0,100,1,NULL,NULL,1,'2026-10-22 23:28:10.217','2026-10-22 23:28:10.217','Giam gia 10 phan tram','percent',10,10000,500000,NULL,NULL),(11,'SALE10-7097','percent',0,0,100,1,NULL,NULL,1,'2026-10-23 00:20:40.962','2026-10-23 00:20:40.962','Giam gia 10 phan tram','percent',10,10000,500000,NULL,NULL),(12,'SALE10-7226','percent',0,0,100,1,NULL,NULL,1,'2026-10-23 00:39:32.806','2026-10-23 00:39:32.806','Giam gia 10 phan tram','percent',10,10000,500000,NULL,NULL);
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_logs`
--

DROP TABLE IF EXISTS `login_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `login_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `ip` varchar(50) NOT NULL,
  `user_agent` varchar(500) NOT NULL,
  `device` varchar(150) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_login_logs_user_id` (`user_id`),
  KEY `idx_login_logs_created_at` (`created_at`),
  CONSTRAINT `fk_login_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_logs`
--

LOCK TABLES `login_logs` WRITE;
/*!40000 ALTER TABLE `login_logs` DISABLE KEYS */;
INSERT INTO `login_logs` VALUES (1,18,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','Google Chrome trên Windows PC','Nội bộ máy chủ (Localhost)','2026-10-28 10:29:39.643');
/*!40000 ALTER TABLE `login_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã dòng chi tiết',
  `order_id` bigint(20) unsigned DEFAULT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Sản phẩm gốc (có thể trống nếu sản phẩm đã bị xóa)',
  `variant_id` bigint(20) unsigned DEFAULT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `variant_info` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL COMMENT 'Ảnh sản phẩm tại thời điểm mua',
  `unit_price` decimal(15,0) NOT NULL COMMENT 'Đơn giá tại thời điểm mua',
  `quantity` bigint(20) DEFAULT NULL,
  `line_total` decimal(15,0) NOT NULL COMMENT 'Thành tiền = đơn giá x số lượng',
  `variant_sku` varchar(100) DEFAULT NULL,
  `price` bigint(20) DEFAULT NULL,
  `sale_price` bigint(20) DEFAULT NULL,
  `sub_total` bigint(20) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`),
  KEY `fk_oi_prod` (`product_id`),
  KEY `fk_order_items_variant` (`variant_id`),
  KEY `idx_order_items_order_id` (`order_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_oi_var` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`),
  CONSTRAINT `fk_orders_items` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết các sản phẩm trong đơn hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,NULL,19,'Bàn làm việc gỗ sồi Oslo','',NULL,0,3,0,'TEST-SKU-ORDER-120252',500000,NULL,1500000,'2026-10-09 12:02:52.657'),(2,3,NULL,15,'Sofa da cao cấp phòng khách','Nâu, 2m, Da',NULL,0,2,0,'SF-NAU-2M',8500000,NULL,17000000,'2026-10-09 12:16:08.624'),(3,4,NULL,20,'Bàn làm việc gỗ sồi Oslo','',NULL,0,3,0,'TEST-SKU-ORDER-121705',500000,NULL,1500000,'2026-10-09 12:17:05.798'),(4,5,NULL,15,'Sofa da cao cấp phòng khách','Nâu, 2m, Da',NULL,0,2,0,'SF-NAU-2M',8500000,NULL,17000000,'2026-10-09 12:18:24.584'),(5,6,NULL,15,'Sofa da cao cấp phòng khách','Nâu, 2m, Da',NULL,0,2,0,'SF-NAU-2M',8500000,NULL,17000000,'2026-10-09 12:27:45.078'),(6,7,NULL,15,'Sofa da cao cấp phòng khách','Nâu, 2m, Da',NULL,0,1,0,'SF-NAU-2M',8500000,NULL,8500000,'2026-10-09 12:34:27.223'),(7,8,NULL,13,'Đèn cây đứng Arc','Đen, Cao 180 cm, Kim loại',NULL,0,2,0,'DEN-ARC-BLK',1450000,NULL,2900000,'2026-10-14 13:54:20.658'),(8,8,NULL,15,'Sofa da cao cấp phòng khách','Nâu, 2m, Da',NULL,0,2,0,'SF-NAU-2M',8500000,NULL,17000000,'2026-10-14 13:54:20.658'),(9,9,NULL,15,'Sofa da cao cấp phòng khách','Nâu, 2m, Da',NULL,0,1,0,'SF-NAU-2M',8500000,NULL,8500000,'2026-10-14 14:42:32.864'),(10,10,NULL,11,'Giường ngủ gỗ óc chó Kyoto','Nâu óc chó, 1m6 x 2m, Gỗ óc chó',NULL,0,1,0,'GIUONG-KYOTO-16',8900000,NULL,8900000,'2026-10-14 15:17:16.820'),(11,11,NULL,52,'Tủ Áo Maxine','Nâu, 120x60x200cm, Khung gỗ Okumi, MDF veneer recon Walnut, chân inox mạ PVD màu gold',NULL,0,2,0,'TU-MAXINE',20000000,NULL,40000000,'2026-10-17 21:53:27.053'),(12,12,NULL,49,'Tủ Áo Victoria II 1M8','Trắng, 180x70x210 cm, Gỗ Ash kết hợp MDF phủ veneer Ash, hoàn thiện sơn',NULL,0,1,0,'TU-VICTORIA',30000000,NULL,30000000,'2026-10-17 22:48:34.597'),(13,13,NULL,35,'Ghế Armchair Jupiter','Nâu, 87x82x60, 100% Polyester. Vải 6D6U Brown.',NULL,0,1,0,'GHE-JUPITER',18990000,NULL,18990000,'2026-10-17 23:09:29.603'),(14,14,NULL,52,'Tủ Áo Maxine','Nâu, 120x60x200cm, Khung gỗ Okumi, MDF veneer recon Walnut, chân inox mạ PVD màu gold',NULL,0,1,0,'TU-MAXINE',20000000,NULL,20000000,'2026-10-17 23:15:02.884'),(15,15,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',1000,NULL,1000,'2026-10-17 23:37:05.318'),(16,16,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-17 23:39:03.948'),(17,17,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-17 23:52:34.006'),(18,18,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-18 00:24:12.481'),(19,19,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-18 00:47:29.993'),(20,20,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-19 14:58:40.002'),(21,21,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-21 12:15:14.173'),(22,22,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-22 13:29:24.528'),(23,23,NULL,54,'Bàn Làm Việc Coastal','',NULL,0,3,0,'TEST-SKU-ORDER-232303',500000,NULL,1500000,'2026-10-22 23:23:03.345'),(24,24,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,2,0,'BAN-LAM-VIEC',5000,NULL,10000,'2026-10-22 23:28:10.325'),(25,25,NULL,43,'Giường Ona Him 1M8 Da Bò Nâu','Nâu, 200x180x100, Gỗ sồi tự nhiên, bọc da bò màu nâu',NULL,0,1,0,'GIUONG-ONA',69900000,NULL,69900000,'2026-10-22 23:41:49.638'),(26,25,NULL,52,'Tủ Áo Maxine','Nâu, 120x60x200cm, Khung gỗ Okumi, MDF veneer recon Walnut, chân inox mạ PVD màu gold',NULL,0,1,0,'TU-MAXINE',20000000,NULL,20000000,'2026-10-22 23:41:49.638'),(27,26,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,2,0,'BAN-LAM-VIEC',5000,NULL,10000,'2026-10-23 00:20:41.062'),(28,27,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,2,0,'BAN-LAM-VIEC',5000,NULL,10000,'2026-10-23 00:39:32.909'),(29,28,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-28 09:37:27.863'),(30,29,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-28 10:13:51.004'),(31,30,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-28 10:31:05.390'),(32,31,NULL,53,'Bàn làm việc','Nâu, 200x180x100, Kim loại',NULL,0,1,0,'BAN-LAM-VIEC',5000,NULL,5000,'2026-10-28 10:40:00.417');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_histories`
--

DROP TABLE IF EXISTS `order_status_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_status_histories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã bản ghi',
  `order_id` bigint(20) unsigned NOT NULL COMMENT 'Thuộc đơn hàng nào',
  `from_status` varchar(20) DEFAULT NULL COMMENT 'Trạng thái cũ',
  `to_status` varchar(20) NOT NULL COMMENT 'Trạng thái mới',
  `changed_by` bigint(20) unsigned DEFAULT NULL COMMENT 'Ai là người đổi (tài khoản admin)',
  `note` varchar(255) DEFAULT NULL COMMENT 'Ghi chú khi đổi trạng thái',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Thời điểm đổi',
  PRIMARY KEY (`id`),
  KEY `idx_osh_order` (`order_id`),
  KEY `fk_osh_user` (`changed_by`),
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_osh_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử trạng thái đơn hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_histories`
--

LOCK TABLES `order_status_histories` WRITE;
/*!40000 ALTER TABLE `order_status_histories` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_status_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_logs`
--

DROP TABLE IF EXISTS `order_status_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_status_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned DEFAULT NULL,
  `from_status` varchar(20) DEFAULT NULL,
  `to_status` varchar(20) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `changed_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_status_logs_order_id` (`order_id`),
  CONSTRAINT `fk_orders_status_logs` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_logs`
--

LOCK TABLES `order_status_logs` WRITE;
/*!40000 ALTER TABLE `order_status_logs` DISABLE KEYS */;
INSERT INTO `order_status_logs` VALUES (1,1,'','pending','Khách hàng đặt hàng',1,'2026-10-09 12:02:52.660'),(2,1,'pending','cancelled','Khách đổi ý',1,'2026-10-09 12:02:52.671'),(3,3,'','pending','Khách hàng đặt hàng',4,'2026-10-09 12:16:08.624'),(4,3,'confirmed','confirmed','Admin xac nhan don',1,'2026-10-09 12:16:08.665'),(5,3,'shipping','shipping','Dang giao hang ViettelPost',1,'2026-10-09 12:16:08.674'),(6,3,'delivered','delivered','Khach da nhan hang thanh cong',1,'2026-10-09 12:16:08.682'),(7,4,'','pending','Khách hàng đặt hàng',1,'2026-10-09 12:17:05.798'),(8,4,'pending','cancelled','Khách đổi ý',1,'2026-10-09 12:17:05.804'),(9,5,'','pending','Khách hàng đặt hàng',5,'2026-10-09 12:18:24.584'),(10,5,'confirmed','confirmed','Admin xac nhan don',1,'2026-10-09 12:18:24.625'),(11,5,'shipping','shipping','Dang giao hang ViettelPost',1,'2026-10-09 12:18:24.632'),(12,5,'delivered','delivered','Khach da nhan hang thanh cong',1,'2026-10-09 12:18:24.641'),(13,6,'','pending','Khách hàng đặt hàng',6,'2026-10-09 12:27:45.079'),(14,6,'confirmed','confirmed','Admin xac nhan don',1,'2026-10-09 12:27:45.130'),(15,6,'shipping','shipping','Dang giao hang ViettelPost',1,'2026-10-09 12:27:45.140'),(16,6,'delivered','delivered','Khach da nhan hang thanh cong',1,'2026-10-09 12:27:45.149'),(17,7,'','pending','Khách hàng đặt hàng',7,'2026-10-09 12:34:27.224'),(18,7,'confirmed','confirmed',NULL,1,'2026-10-09 12:36:53.239'),(19,7,'shipping','shipping',NULL,1,'2026-10-09 12:37:09.552'),(20,7,'delivered','delivered',NULL,1,'2026-10-09 12:37:18.547'),(21,8,'','pending','Khách hàng đặt hàng',8,'2026-10-14 13:54:20.665'),(22,8,'confirmed','confirmed',NULL,1,'2026-10-14 14:37:47.279'),(23,8,'shipping','shipping',NULL,1,'2026-10-14 14:39:28.096'),(24,8,'delivered','delivered',NULL,1,'2026-10-14 14:39:36.215'),(25,9,'','pending','Khách hàng đặt hàng',8,'2026-10-14 14:42:32.864'),(26,9,'confirmed','confirmed',NULL,1,'2026-10-14 14:42:56.749'),(27,10,'','pending','Khách hàng đặt hàng',8,'2026-10-14 15:17:16.821'),(28,10,'pending','cancelled','tôi muốn chọn lại',8,'2026-10-14 15:17:53.419'),(29,11,'','pending','Khách hàng đặt hàng',9,'2026-10-17 21:53:27.054'),(30,11,'confirmed','confirmed','Admin xac nhan don',1,'2026-10-17 21:53:27.075'),(31,11,'shipping','shipping','Dang giao hang ViettelPost',1,'2026-10-17 21:53:27.080'),(32,11,'delivered','delivered','Khach da nhan hang thanh cong',1,'2026-10-17 21:53:27.084'),(33,12,'','pending','Khách hàng đặt hàng',8,'2026-10-17 22:48:34.602'),(34,12,'pending','cancelled','đổi phương thức',8,'2026-10-17 22:52:33.991'),(35,13,'','pending','Khách hàng đặt hàng',8,'2026-10-17 23:09:29.605'),(36,13,'pending','cancelled','đổi pt',8,'2026-10-17 23:13:35.809'),(37,14,'','pending','Khách hàng đặt hàng',8,'2026-10-17 23:15:02.886'),(38,14,'awaiting_payment','confirmed','SePay: Thanh toán thành công 19500000 đ qua MBBank (STK: 0931883988, Mã GD: 888888)',0,'2026-10-17 23:29:48.054'),(39,15,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',8,'2026-10-17 23:37:05.319'),(40,15,'awaiting_payment','cancelled','Khách hàng hủy thanh toán chuyển khoản',8,'2026-10-17 23:38:30.905'),(41,16,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',8,'2026-10-17 23:39:03.951'),(42,16,'awaiting_payment','cancelled','Khách hàng hủy thanh toán chuyển khoản',8,'2026-10-17 23:52:30.026'),(43,17,'','pending','Khách hàng đặt hàng (COD) - Chờ xác nhận',8,'2026-10-17 23:52:34.008'),(44,18,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',8,'2026-10-18 00:24:12.485'),(45,18,'awaiting_payment','confirmed','SePay: Thanh toán thành công 5000 đ qua MBBank (STK: 0931883988, Mã GD: 7218992673444700196)',0,'2026-10-18 00:24:39.818'),(46,18,'shipping','shipping',NULL,1,'2026-10-18 00:38:04.911'),(47,18,'delivered','delivered',NULL,1,'2026-10-18 00:38:06.972'),(48,19,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',8,'2026-10-18 00:47:29.994'),(49,20,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',8,'2026-10-19 14:58:40.005'),(50,20,'awaiting_payment','confirmed','SePay: Thanh toán thành công 5000 đ qua MBBank (STK: 0931883988, Mã GD: 4245621944447948368)',0,'2026-10-19 14:59:13.480'),(51,21,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',8,'2026-10-21 12:15:14.181'),(52,21,'awaiting_payment','confirmed','SePay: Thanh toán thành công 5000 đ qua MBBank (STK: 0931883988, Mã GD: 7252074543255208063)',0,'2026-10-21 12:16:18.790'),(53,22,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',11,'2026-10-22 13:29:24.535'),(54,22,'awaiting_payment','cancelled','Khách hàng hủy thanh toán chuyển khoản',11,'2026-10-22 13:30:31.608'),(55,23,'','pending','Khách hàng đặt hàng (COD) - Chờ xác nhận',1,'2026-10-22 23:23:03.346'),(56,23,'pending','cancelled','Khách đổi ý',1,'2026-10-22 23:23:03.348'),(57,24,'','pending','Khách hàng đặt hàng (COD) - Chờ xác nhận',14,'2026-10-22 23:28:10.326'),(58,24,'confirmed','confirmed','Admin xac nhan don',1,'2026-10-22 23:28:10.345'),(59,24,'shipping','shipping','Dang giao hang ViettelPost',1,'2026-10-22 23:28:10.349'),(60,24,'delivered','delivered','Khach da nhan hang thanh cong',1,'2026-10-22 23:28:10.353'),(61,25,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',1,'2026-10-22 23:41:49.640'),(62,25,'awaiting_payment','cancelled','Khách hàng hủy thanh toán chuyển khoản',1,'2026-10-22 23:42:05.415'),(63,26,'','pending','Khách hàng đặt hàng (COD) - Chờ xác nhận',15,'2026-10-23 00:20:41.063'),(64,26,'confirmed','confirmed','Admin xac nhan don',1,'2026-10-23 00:20:41.081'),(65,26,'shipping','shipping','Dang giao hang ViettelPost',1,'2026-10-23 00:20:41.085'),(66,26,'delivered','delivered','Khach da nhan hang thanh cong',1,'2026-10-23 00:20:41.089'),(67,27,'','pending','Khách hàng đặt hàng (COD) - Chờ xác nhận',16,'2026-10-23 00:39:32.912'),(68,27,'confirmed','confirmed','Admin xac nhan don',1,'2026-10-23 00:39:32.933'),(69,27,'shipping','shipping','Dang giao hang ViettelPost',1,'2026-10-23 00:39:32.938'),(70,27,'delivered','delivered','Khach da nhan hang thanh cong',1,'2026-10-23 00:39:32.942'),(71,28,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',8,'2026-10-28 09:37:27.873'),(72,28,'awaiting_payment','confirmed','SePay: Thanh toán thành công 5000 đ qua MBBank (STK: 0931883988, Mã GD: 93854235)',0,'2026-10-28 09:37:57.881'),(73,29,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',17,'2026-10-28 10:13:51.006'),(74,29,'awaiting_payment','confirmed','SePay: Thanh toán thành công 5000 đ qua MBBank (STK: 0931883988, Mã GD: 93863055)',0,'2026-10-28 10:14:11.269'),(75,30,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',18,'2026-10-28 10:31:05.393'),(76,30,'awaiting_payment','confirmed','SePay: Thanh toán thành công 5000 đ qua MBBank (STK: 0931883988, Mã GD: 93867403)',0,'2026-10-28 10:32:20.720'),(77,31,'','awaiting_payment','Khách hàng tạo đơn - Chờ chuyển khoản SePay (MBBank)',18,'2026-10-28 10:40:00.421'),(78,31,'awaiting_payment','cancelled','Khách hàng hủy thanh toán chuyển khoản',18,'2026-10-28 10:40:26.114');
/*!40000 ALTER TABLE `order_status_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã đơn (số thứ tự nội bộ)',
  `order_code` varchar(50) DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `coupon_id` bigint(20) unsigned DEFAULT NULL,
  `receiver_name` varchar(150) NOT NULL COMMENT 'Tên người nhận',
  `receiver_phone` varchar(20) NOT NULL COMMENT 'Số điện thoại người nhận',
  `receiver_email` varchar(190) DEFAULT NULL COMMENT 'Email người nhận (để gửi xác nhận đơn)',
  `shipping_address` text DEFAULT NULL,
  `subtotal` decimal(15,0) NOT NULL COMMENT 'Tiền hàng (chưa gồm ship, chưa trừ giảm giá)',
  `shipping_fee` bigint(20) DEFAULT NULL,
  `discount_amount` bigint(20) DEFAULT NULL,
  `total` decimal(15,0) NOT NULL COMMENT 'Tổng thanh toán = tiền hàng + ship - giảm giá',
  `payment_method` varchar(30) DEFAULT 'cod',
  `payment_status` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid' COMMENT 'Trạng thái thanh toán: unpaid = chưa thanh toán, paid = đã thanh toán, refunded = đã hoàn tiền',
  `order_status` enum('pending','confirmed','shipping','completed','cancelled','returned') NOT NULL DEFAULT 'pending' COMMENT 'Trạng thái đơn: pending = chờ xác nhận, confirmed = đã xác nhận, shipping = đang giao, completed = hoàn thành, cancelled = đã hủy, returned = trả hàng',
  `note` text DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `order_number` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `sub_total` bigint(20) DEFAULT NULL,
  `total_amount` bigint(20) DEFAULT NULL,
  `coupon_code` varchar(50) DEFAULT NULL,
  `recipient_name` varchar(100) DEFAULT NULL,
  `recipient_phone` varchar(20) DEFAULT NULL,
  `cancelled_at` datetime(3) DEFAULT NULL,
  `cancel_reason` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_user` (`user_id`,`created_at`),
  KEY `idx_order_status` (`order_status`),
  KEY `fk_orders_coupon` (`coupon_id`),
  KEY `idx_orders_user_id` (`user_id`),
  CONSTRAINT `fk_order_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'',1,NULL,'','',NULL,'123 Đường Test, Quận 1, TP.HCM',0,0,0,0,'cod','unpaid','pending',NULL,'2026-10-09 12:02:52.655','2026-10-09 12:02:52.666','FS-20261009-00001','cancelled',1500000,1500000,NULL,'Người Nhận Test','0988776655','2026-10-09 12:02:52.666','Khách đổi ý'),(3,'FS-20261009-00001',4,5,'','',NULL,'So 123 Nam Ky Khoi Nghia, Q1, TPHCM',0,0,500000,0,'cod','unpaid','pending','Giao hang can than','2026-10-09 12:16:08.624','2026-10-09 12:16:08.681',NULL,'delivered',17000000,16500000,'SALE10-4514','Khach Hang Test 86992','0912345678',NULL,NULL),(4,'FS-20261009-00002',1,NULL,'','',NULL,'123 Đường Test, Quận 1, TP.HCM',0,0,0,0,'cod','unpaid','pending',NULL,'2026-10-09 12:17:05.797','2026-10-09 12:17:05.801',NULL,'cancelled',1500000,1500000,NULL,'Người Nhận Test','0988776655','2026-10-09 12:17:05.801','Khách đổi ý'),(5,'FS-20261009-00003',5,6,'','',NULL,'So 123 Nam Ky Khoi Nghia, Q1, TPHCM',0,0,500000,0,'cod','unpaid','pending','Giao hang can than','2026-10-09 12:18:24.583','2026-10-09 12:18:24.640',NULL,'delivered',17000000,16500000,'SALE10-6468','Khach Hang Test 45382','0912345678',NULL,NULL),(6,'FS-20261009-00004',6,7,'','',NULL,'So 123 Nam Ky Khoi Nghia, Q1, TPHCM',0,0,500000,0,'cod','unpaid','pending','Giao hang can than','2026-10-09 12:27:45.077','2026-10-09 12:27:45.148',NULL,'delivered',17000000,16500000,'SALE10-1730','Khach Hang Test 82673','0912345678',NULL,NULL),(7,'FS-20261009-00005',7,NULL,'','',NULL,'123 Le Loi, Q1, HCM',0,0,0,0,'cod','unpaid','pending',NULL,'2026-10-09 12:34:27.221','2026-10-09 12:37:18.546',NULL,'delivered',8500000,8500000,NULL,'Nguyen Van A','0987654321',NULL,NULL),(8,'FS-20261014-00001',NULL,NULL,'NguyenBang','0931883988',NULL,'295 Tây Thạnh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'cod','unpaid','pending','đến nơi hãy gọi vào số này 0099887744 [Phương thức: COD]','2026-10-14 13:54:20.642','2026-10-14 14:39:36.211','FS-20261014-00001','delivered',19900000,19900000,NULL,'NguyenBang','0931883988',NULL,NULL),(9,'FS-20261014-00002',NULL,NULL,'','',NULL,'615 âu cơ, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'cod','unpaid','pending','[Phương thức: COD]','2026-10-14 14:42:32.862','2026-10-14 14:42:56.746','FS-20261014-00002','confirmed',8500000,8500000,NULL,'NguyenBang','0931883988',NULL,NULL),(10,'FS-20261014-00003',NULL,NULL,'','',NULL,'295 tay thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'cod','unpaid','pending','[Phương thức: COD]','2026-10-14 15:17:16.818','2026-10-14 15:17:53.414','FS-20261014-00003','cancelled',8900000,8900000,NULL,'NguyenBang','Nguyen Bang','2026-10-14 15:17:53.414','tôi muốn chọn lại'),(11,'FS-20261017-00001',9,8,'','',NULL,'So 123 Nam Ky Khoi Nghia, Q1, TPHCM',0,0,500000,0,'cod','unpaid','pending','Giao hang can than','2026-10-17 21:53:27.052','2026-10-17 21:53:27.084','FS-20261017-00001','delivered',40000000,39500000,'SALE10-7806','Khach Hang Test 90912','0912345678',NULL,NULL),(12,'FS-20261017-00002',NULL,NULL,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'cod','unpaid','pending','[Phương thức: Chuyển khoản]','2026-10-17 22:48:34.595','2026-10-17 22:52:33.983','FS-20261017-00002','cancelled',30000000,30000000,NULL,'NguyenBang','0931883988','2026-10-17 22:52:33.982','đổi phương thức'),(13,'FS-20261017-00003',NULL,NULL,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'cod','unpaid','pending','[Phương thức: Chuyển khoản]','2026-10-17 23:09:29.598','2026-10-17 23:13:35.803','FS-20261017-00003','cancelled',18990000,18990000,NULL,'NguyenBang','0931883988','2026-10-17 23:13:35.802','đổi pt'),(14,'FS-20261017-00004',NULL,8,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,500000,0,'cod','unpaid','pending','[Phương thức: Chuyển khoản]','2026-10-17 23:15:02.883','2026-10-17 23:29:48.053','FS-20261017-00004','confirmed',20000000,19500000,'SALE10-7806','NguyenBang','0931883988',NULL,NULL),(15,'FS-20261017-00005',NULL,NULL,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-17 23:37:05.315','2026-10-17 23:38:30.905','FS-20261017-00005','cancelled',1000,1000,NULL,'NguyenBang','0931883988','2026-10-17 23:38:30.905','Khách hàng hủy thanh toán chuyển khoản'),(16,'FS-20261017-00006',NULL,NULL,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-17 23:39:03.947','2026-10-17 23:52:30.026','FS-20261017-00006','cancelled',5000,5000,NULL,'NguyenBang','0931883988','2026-10-17 23:52:30.026','Khách hàng hủy thanh toán chuyển khoản'),(17,'FS-20261017-00007',NULL,NULL,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'cod','unpaid','pending','[Phương thức: COD]','2026-10-17 23:52:34.003','2026-10-17 23:52:34.003','FS-20261017-00007','pending',5000,5000,NULL,'NguyenBang','0931883988',NULL,NULL),(18,'FS-20261018-00001',NULL,NULL,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-18 00:24:12.476','2026-10-18 00:38:06.969','FS-20261018-00001','delivered',5000,5000,NULL,'NguyenBang','0931883988',NULL,NULL),(19,'FS-20261018-00002',NULL,NULL,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-18 00:47:29.989','2026-10-18 00:47:29.989','FS-20261018-00002','awaiting_payment',5000,5000,NULL,'NguyenBang','0931883988',NULL,NULL),(20,'FS-20261019-00001',NULL,NULL,'','',NULL,'295 tsy thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-19 14:58:39.994','2026-10-19 14:59:13.479','FS-20261019-00001','confirmed',5000,5000,NULL,'Nguyen Bang','0931883988',NULL,NULL),(21,'FS-20261021-00001',NULL,NULL,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-21 12:15:14.167','2026-10-21 12:16:18.789','FS-20261021-00001','confirmed',5000,5000,NULL,'NguyenBAng','0931883988',NULL,NULL),(22,'FS-20261022-00001',11,NULL,'','',NULL,'295Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-22 13:29:24.516','2026-10-22 13:30:31.609','FS-20261022-00001','cancelled',5000,5000,NULL,'Hà Triệu Chinh','0888213445','2026-10-22 13:30:31.608','Khách hàng hủy thanh toán chuyển khoản'),(23,'FS-20261022-00002',1,NULL,'','',NULL,'123 Đường Test, Quận 1, TP.HCM',0,0,0,0,'cod','unpaid','pending',NULL,'2026-10-22 23:23:03.344','2026-10-22 23:23:03.347','FS-20261022-00002','cancelled',1500000,1500000,NULL,'Người Nhận Test','0988776655','2026-10-22 23:23:03.347','Khách đổi ý'),(24,'FS-20261022-00003',14,10,'','',NULL,'So 123 Nam Ky Khoi Nghia, Q1, TPHCM',0,0,1000,0,'cod','unpaid','pending','Giao hang can than','2026-10-22 23:28:10.325','2026-10-22 23:28:10.353','FS-20261022-00003','delivered',10000,9000,'SALE10-6824','Khach Hang Test 69601','0912345678',NULL,NULL),(25,'FS-20261022-00004',1,NULL,'','',NULL,'77 mai ninh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-22 23:41:49.637','2026-10-22 23:42:05.415','FS-20261022-00004','cancelled',89900000,89900000,NULL,'Quản trị viên','0888888888','2026-10-22 23:42:05.415','Khách hàng hủy thanh toán chuyển khoản'),(26,'FS-20261023-00001',15,11,'','',NULL,'So 123 Nam Ky Khoi Nghia, Q1, TPHCM',0,0,1000,0,'cod','unpaid','pending','Giao hang can than','2026-10-23 00:20:41.062','2026-10-23 00:20:41.088','FS-20261023-00001','delivered',10000,9000,'SALE10-7097','Khach Hang Test 56983','0912345678',NULL,NULL),(27,'FS-20261023-00002',16,12,'','',NULL,'So 123 Nam Ky Khoi Nghia, Q1, TPHCM',0,0,1000,0,'cod','unpaid','pending','Giao hang can than','2026-10-23 00:39:32.909','2026-10-23 00:39:32.941','FS-20261023-00002','delivered',10000,9000,'SALE10-7226','Khach Hang Test 99852','0912345678',NULL,NULL),(28,'FS-20261028-00001',NULL,NULL,'','',NULL,'295 Tay Thanh, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-28 09:37:27.850','2026-10-28 09:37:57.878','FS-20261028-00001','confirmed',5000,5000,NULL,'NguyenBang','0931883988',NULL,NULL),(29,'FS-20261028-00002',NULL,NULL,'','',NULL,'295, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-28 10:13:50.996','2026-10-28 10:14:11.268','FS-20261028-00002','confirmed',5000,5000,NULL,'Bang Nguyen','0931883988',NULL,NULL),(30,'FS-20261028-00003',18,NULL,'','',NULL,'295, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-28 10:31:05.381','2026-10-28 10:32:20.720','FS-20261028-00003','confirmed',5000,5000,NULL,'Bang Nguyen','0931883988',NULL,NULL),(31,'FS-20261028-00004',18,NULL,'','',NULL,'295, Phường Phú Trung, Quận Tân Phú, Thành phố Hồ Chí Minh',0,0,0,0,'bank_transfer','unpaid','pending','[Phương thức: Chuyển khoản SePay]','2026-10-28 10:40:00.412','2026-10-28 10:40:26.115','FS-20261028-00004','cancelled',5000,5000,NULL,'Bang Nguyen','0931883988','2026-10-28 10:40:26.114','Khách hàng hủy thanh toán chuyển khoản');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(190) DEFAULT NULL,
  `otp` varchar(10) DEFAULT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_password_resets_email` (`email`),
  KEY `idx_password_resets_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (1,'nbang10072005@gmail.com','519263','2026-10-22 11:11:59.316',1,'2026-10-22 11:01:59.317'),(2,'nbang10072005@gmail.com','345854','2026-10-22 11:13:03.242',1,'2026-10-22 11:03:03.242'),(3,'nbang10072005@gmail.com','900299','2026-10-22 11:57:13.541',0,'2026-10-22 11:47:13.543'),(4,'hatrieuchinh05@gmail.com','725792','2026-10-22 11:59:36.145',0,'2026-10-22 11:49:36.146'),(5,'chinhhadl@gmail.com','401972','2026-10-22 12:41:16.247',1,'2026-10-22 12:31:16.248'),(6,'chinhhadl@gmail.com','789601','2026-10-22 13:09:06.940',1,'2026-10-22 12:59:06.942'),(7,'chinhhadl@gmail.com','527310','2026-10-22 14:00:53.415',0,'2026-10-22 13:50:53.415');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_images` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã ảnh',
  `product_id` bigint(20) unsigned NOT NULL,
  `variant_id` bigint(20) unsigned DEFAULT NULL,
  `url` varchar(255) NOT NULL,
  `alt` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `sort_order` bigint(20) DEFAULT 0,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_img_product` (`product_id`),
  KEY `idx_img_variant` (`variant_id`),
  KEY `idx_product_images_product_id` (`product_id`),
  KEY `idx_product_images_variant_id` (`variant_id`),
  CONSTRAINT `fk_img_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_img_var` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_images` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ảnh sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (19,8,NULL,'/uploads/2026/10/1303d42325395c31d4aa58a41e70381c.webp','sofa-moretti-xam-dam-4',1,0,'2026-10-15 11:46:07.261'),(20,8,NULL,'/uploads/2026/10/033af5063e28a77ec62db6ed5d2de3c7.webp','sofa-moretti-xam-dam-1',0,1,'2026-10-15 11:46:07.262'),(21,8,NULL,'/uploads/2026/10/b3070e5204887eaf98c9104246b3e9ce.webp','sofa-moretti-xam-dam-2 (1)',0,2,'2026-10-15 11:46:07.262'),(22,7,NULL,'/uploads/2026/10/82f4f4502b9adad1eb8086438d2683f6.webp','Sofa-Porto-da-3-cho-hien-dai-mau-VACT10509',1,0,'2026-10-15 11:47:44.797'),(23,7,NULL,'/uploads/2026/10/8174bba33d81c390896c0093e0c18c08.jpg','porto',0,1,'2026-10-15 11:47:44.798'),(24,7,NULL,'/uploads/2026/10/ff6e8d4e7a6fb40254427c05c4b32668.jpg','sofa_porto_da',0,2,'2026-10-15 11:47:44.799'),(25,6,NULL,'/uploads/2026/10/a33395a1173f80efbc2ad3d6e1352a01.jpg','103105-den-ban-savona-ma-trang',1,0,'2026-10-15 11:52:08.866'),(26,6,NULL,'/uploads/2026/10/4c2bb9d384f211f52d09c647ce622927.jpg','103105-den-ban-savona-ma-trang-2',0,1,'2026-10-15 11:52:08.868'),(27,5,NULL,'/uploads/2026/10/22191071e1c13a66e60506010a6e914a.webp','giuong-bridge-2',1,0,'2026-10-15 11:56:49.056'),(28,5,NULL,'/uploads/2026/10/ee7a01c22623c5bc3014f5dc0ca6314b.webp','Giuong-brigde-hien-dai',0,1,'2026-10-15 11:56:49.056'),(29,5,NULL,'/uploads/2026/10/fb776f40ef46784eb1bb9788f78699bd.webp','Giuong-Bridge-1',0,2,'2026-10-15 11:56:49.056'),(30,4,NULL,'/uploads/2026/10/6f129e164922deccf1cbc00dba2bc728.webp','sofa-skagen-1-copy',1,0,'2026-10-15 12:03:05.340'),(31,4,NULL,'/uploads/2026/10/3ed73d7558af414c6dd59bb9d73d1470.webp','sofa-skagen-7-copy',0,1,'2026-10-15 12:03:05.341'),(32,4,NULL,'/uploads/2026/10/6f22c7be91e292d4a478c0a5fc070f90.webp','sofa-skagen-11-copy',0,2,'2026-10-15 12:03:05.341'),(33,4,NULL,'/uploads/2026/10/a0e2d231a42e003b7776fb84d10830f2.webp','sofa-skagen-13-copy',0,3,'2026-10-15 12:03:05.341'),(34,3,NULL,'/uploads/2026/10/8bfecfc694f053b880ecfe9f632890af.jpg','Ghe-an-coastal-3_106833',1,0,'2026-10-15 12:08:19.795'),(35,3,NULL,'/uploads/2026/10/b0d921caf376386dda6bdcef7dc132fb.jpg','phong-an-coastal',0,1,'2026-10-15 12:08:19.796'),(36,2,NULL,'/uploads/2026/10/5dda1633816fa6f6538fd2b94942beae.webp','ban-an-bridge-tron-1',1,0,'2026-10-15 12:56:46.253'),(37,2,NULL,'/uploads/2026/10/493f4dd90057eba503a4b54c2cb19445.webp','ban-an-bridge-tron',0,1,'2026-10-15 12:56:46.254'),(38,2,NULL,'/uploads/2026/10/6ed9513fd9d7853b71f5813151712805.webp','ban-an-bridge-tron-lifestyle',0,2,'2026-10-15 12:56:46.255'),(39,1,NULL,'/uploads/2026/10/2f457cf827740dcc703a72cbd7250418.jpg','Ban-lam-viec-Coastal',1,0,'2026-10-15 13:01:02.233'),(40,1,NULL,'/uploads/2026/10/179bdf4ade2c219b9cc0406436631bf0.jpg','Ban-lam-viec-Coastal-1',0,1,'2026-10-15 13:01:02.233'),(41,1,NULL,'/uploads/2026/10/27385d716544cd6578321e7074c0bc65.jpg','Ban-lam-viec-Coastal-2',0,2,'2026-10-15 13:01:02.233'),(45,10,NULL,'/uploads/2026/10/8208f539fa66440cee59cebabcacf7ca.webp','Sofa-Queens-goc-trai-hien-dai-da-Taupe',1,0,'2026-10-15 13:23:20.915'),(46,10,NULL,'/uploads/2026/10/f1bee0e142228e32282f1eafbb4a2fe9.jpg','queens3',0,1,'2026-10-15 13:23:20.918'),(47,9,NULL,'/uploads/2026/10/a425ce25685d3aeed22e7301eb637bac.webp','SOFA-COASTAL-GP-VAI-VACT-7502',1,0,'2026-10-15 13:39:06.470'),(48,9,NULL,'/uploads/2026/10/5d9fe5a7ea839efc0c5bd6f71e90cd8e.webp','SOFA-COASTAL-GP-VAI-VACT-7502-1',0,1,'2026-10-15 13:39:06.471'),(49,9,NULL,'/uploads/2026/10/321eb4a1c838308f8ffa4db6fd813926.jpg','sofa-goc-coastal-mau-xanh',0,2,'2026-10-15 13:39:06.472'),(50,12,NULL,'/uploads/2026/10/77b6bda3e4f9abf21fb1cfdb3d281ee4.webp','ban-an-victoria-II-1m8-1-1',1,0,'2026-10-15 14:37:31.014'),(51,12,NULL,'/uploads/2026/10/56c9251ebe9194658f1f46001dd5114c.webp','ban-an-victoria-II-1m8-2-1',0,1,'2026-10-15 14:37:31.016'),(52,12,NULL,'/uploads/2026/10/c55ff981cc24141253d9bcce38dab20d.webp','ban-an-victoria-II-1m8-3-1',0,2,'2026-10-15 14:37:31.018'),(53,13,NULL,'/uploads/2026/10/a55337d04f4a8e7dc991fd3859a9d773.jpg','1000-san-pham-nha-xinh83-43',1,0,'2026-10-15 14:44:12.306'),(54,13,NULL,'/uploads/2026/10/b432a90258892aa9e4a0763f77990d09.jpg','90954_22-4',0,1,'2026-10-15 14:44:12.310'),(55,13,NULL,'/uploads/2026/10/a1d0d38430d3fef86dc0acb9b32978ed.jpg','ban-an-oak',0,2,'2026-10-15 14:44:12.313'),(56,14,NULL,'/uploads/2026/10/9c2fa9109ebba75f467f8885375aa5f0.webp','ban-an-cameo-8-cho (1)',1,0,'2026-10-15 14:57:52.685'),(57,14,NULL,'/uploads/2026/10/b26bb0477142a8c25f70d9114e5fde0d.jpg','Bàn ăn 1',0,1,'2026-10-15 14:57:52.687'),(58,14,NULL,'/uploads/2026/10/65e5ea809c2d4e716b911677ad59da93.jpg','Bàn ăn 2',0,2,'2026-10-15 14:57:52.688'),(59,14,NULL,'/uploads/2026/10/6ffbcc57ccadfcfa2f064ab398190f07.jpg','Bàn ăn 3',0,3,'2026-10-15 14:57:52.690'),(60,15,NULL,'/uploads/2026/10/e8945d54993344994be79a13cf6e2bef.webp','ban-an-may-1-2',1,0,'2026-10-15 15:04:00.695'),(61,15,NULL,'/uploads/2026/10/683d0f5b0882f21b62840732c421ac2b.webp','ban-an-may-2',0,1,'2026-10-15 15:04:00.698'),(62,15,NULL,'/uploads/2026/10/2953157341796220b9ad288aaa917f62.webp','ban-an-may-3',0,2,'2026-10-15 15:04:00.700'),(63,16,NULL,'/uploads/2026/10/2aa508329d2bb198a98de9cd385c60d9.webp','BAN-AN-1_E0202_EPONJI',1,0,'2026-10-15 15:13:24.349'),(64,16,NULL,'/uploads/2026/10/3fe7678bc6d4c151ad33a3551ae77ac8.webp','life-style-eponji',0,1,'2026-10-15 15:13:24.351'),(65,17,NULL,'/uploads/2026/10/5790a42ee389b454e4f48187c59dc393.webp','Bo-Ban-An-Tan-Co-Dien-Elanoire-8-Ghe-T18-C87-1-800x600.jpg',1,0,'2026-10-15 15:20:17.215'),(66,17,NULL,'/uploads/2026/10/83b9ae764cda4deaef99b56807475a00.webp','Bo-Ban-An-Tan-Co-Dien-Elanoire-8-Ghe-T18-C87-800x600.jpg',0,1,'2026-10-15 15:20:17.218'),(67,18,NULL,'/uploads/2026/10/480c11bc7e058bdb03d6bdedb69a5882.webp','armchair-flow-vai-tana-green-500-1',0,0,'2026-10-15 15:27:24.808'),(68,18,NULL,'/uploads/2026/10/81e03c6465d3696b7bd89e5ab392b219.webp','armchair-flow-vai-tana-green-500-2',1,1,'2026-10-15 15:27:24.811'),(69,18,NULL,'/uploads/2026/10/fd7ba02dcaac9a190c8e3a305d3ad2d1.webp','armchair-flow-vai-tana-green-500-3',0,2,'2026-10-15 15:27:24.813'),(70,18,NULL,'/uploads/2026/10/f91ab0dd04d3bc471d6022515f5e3910.webp','armchair-flow-vai-tana-green-500-4',0,3,'2026-10-15 15:27:24.814'),(71,19,NULL,'/uploads/2026/10/5d55ce98afe7e641fa3a49e207909502.webp','armchair-jupiter-1-3',0,0,'2026-10-15 15:35:07.515'),(72,19,NULL,'/uploads/2026/10/c02248a0bfa14e150d2b663fd2a0ad5f.webp','armchair-jupiter-2',0,1,'2026-10-15 15:35:07.521'),(73,19,NULL,'/uploads/2026/10/4cc3b8f39631809fd33e2480e668c243.webp','armchair-jupiter-5',1,2,'2026-10-15 15:35:07.525'),(77,20,NULL,'/uploads/2026/10/e3d38222084afd09e4fafab307aa19fb.webp','Armchair-victoria-II-vai-linen-rosy-1-1',1,0,'2026-10-15 15:52:49.532'),(78,20,NULL,'/uploads/2026/10/fa3515f25fc9557e3611669d3ffd26ec.jpg','ghế 1',0,1,'2026-10-15 15:52:49.533'),(79,20,NULL,'/uploads/2026/10/ef23eec90b073ce2e392bc6541b820bf.jpg','ghế 2',0,2,'2026-10-15 15:52:49.534'),(80,21,NULL,'/uploads/2026/10/9c679a572e762b19c95e6a79f1950ac0.jpg','roche-new1',1,0,'2026-10-15 18:39:17.669'),(81,21,NULL,'/uploads/2026/10/02c994b4ae035d432c3531aa8862fec2.jpg','Roche-new-3',0,1,'2026-10-15 18:39:17.669'),(82,22,NULL,'/uploads/2026/10/201549c7d63df927dc280a6cd67205ad.webp','giuong-victoria-II-1',1,0,'2026-10-15 18:44:32.343'),(83,22,NULL,'/uploads/2026/10/bceba9603e25c1b4a8aa78894709f725.webp','giuong-victoria-II-2-1',0,1,'2026-10-15 18:44:32.343'),(90,24,NULL,'/uploads/2026/10/7cb49c56f3137fde9f239537b08afc69.jpg','giuong-ona-him-1m8-da-nau-s3',1,0,'2026-10-15 19:14:34.808'),(91,24,NULL,'/uploads/2026/10/80428e2160af276d908ad4ec29ddf231.jpg','giuong-ona-him-1m8-da-nau-s3-1',0,1,'2026-10-15 19:14:34.812'),(92,24,NULL,'/uploads/2026/10/8b5c4bbf8d98ea9aaf6ba177055ed3b7.webp','Giuong-Ona-Him-1m8-da-nau-S3',0,2,'2026-10-15 19:14:34.815'),(93,25,NULL,'/uploads/2026/10/6d0f4c5c7b66d7d5bf07c77f03b8cb1b.png','giuong_pio_2',1,0,'2026-10-15 19:19:58.470'),(94,25,NULL,'/uploads/2026/10/a136b7740915b0c4e60347fdc6d2e8f1.png','giuong-pio-1m8-vai-vact-11303-2',0,1,'2026-10-15 19:19:58.472'),(95,25,NULL,'/uploads/2026/10/8ea37b9e891d0849d7d0251259e921e3.jpg','giuong-ngu-pio-1',0,2,'2026-10-15 19:19:58.473'),(96,26,NULL,'/uploads/2026/10/7e06902856e9d85e7569224c48e32a5d.jpg','giuong-maison-1',1,0,'2026-10-15 19:27:51.348'),(97,26,NULL,'/uploads/2026/10/bf124c5b6179f501a7ab7bc6d84d34a3.jpg','giuong-maison-2',0,1,'2026-10-15 19:27:51.350'),(98,26,NULL,'/uploads/2026/10/852ed2b7b8671430a66cd3a419c6fca2.jpg','giuong-maison-5',0,2,'2026-10-15 19:27:51.350'),(99,27,NULL,'/uploads/2026/10/31e70eecd8a7425b755acea8dcbf9e57.png','GIUONG-LANDA-1M8-VAI-S8R-1',1,0,'2026-10-15 19:32:25.397'),(100,27,NULL,'/uploads/2026/10/c7e77788e1ca91a7a2a99fffe431744f.png','GIUONG-LANDA-1M8-VAI-S8R-4',0,1,'2026-10-15 19:32:25.398'),(101,27,NULL,'/uploads/2026/10/7af23d47b1925169a66f9f71e646710c.png','GIUONG-LANDA-1M8-VAI-S8R-5',0,2,'2026-10-15 19:32:25.399'),(103,28,NULL,'/uploads/2026/10/3171203368f891f012d3aa00c3c37a7a.webp','tu-ao-victoria2-1',1,0,'2026-10-15 19:38:33.890'),(104,28,NULL,'/uploads/2026/10/2f6029c875c90c7a871c8ed716034ba9.webp','tu-ao-victoria-768x768',0,1,'2026-10-15 19:38:33.891'),(105,29,NULL,'/uploads/2026/10/deb8377d381c6a1d7fa8cd01ecad67a0.webp','TU-AO',0,0,'2026-10-15 19:45:23.174'),(106,29,NULL,'/uploads/2026/10/f646e8065bf96a2b9a5895b1a59bee60.webp','TU-AO-DREAM',1,1,'2026-10-15 19:45:23.177'),(107,30,NULL,'/uploads/2026/10/fa4b7fb181629506a80e995597252262.jpg','Tu-ao-Acrylic',1,0,'2026-10-15 19:50:10.742'),(108,30,NULL,'/uploads/2026/10/61f15c679165c225037c9f73451a35d8.jpg','Tu-ao-Acrylic-1',0,1,'2026-10-15 19:50:10.751'),(109,30,NULL,'/uploads/2026/10/b7a896ae5dac222ac86f35a481afcd37.jpg','Tu-ao-Acrylic-2',0,2,'2026-10-15 19:50:10.754'),(110,31,NULL,'/uploads/2026/10/11d482e641b126b451f98e6ad4c9e287.jpg','3_91000_1',1,0,'2026-10-15 19:55:18.637'),(111,31,NULL,'/uploads/2026/10/378515f284894a19fa034393a55040e4.jpg','3_91000_2',0,1,'2026-10-15 19:55:18.643'),(112,23,NULL,'/uploads/2026/10/b5213645bd7d2cf9b265c4a5239af7a3.webp','Giuong-hoc-keo-Penny-1m8-GREYMIST-2584-1-3',1,0,'2026-10-15 21:30:12.366'),(113,23,NULL,'/uploads/2026/10/21eee71c759c7944f09b4afaa0c3420e.jpg','penny-new-3',0,1,'2026-10-15 21:30:12.367'),(114,23,NULL,'/uploads/2026/10/8581f679add976989e5b74664a679b82.jpg','penny-new-4',0,2,'2026-10-15 21:30:12.368'),(115,32,NULL,'/uploads/2026/10/ca13dcceec0de5269c1b84d9ebf5fdec.webp','banner goziila',1,0,'2026-10-28 10:39:34.144');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_variants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã biến thể',
  `product_id` bigint(20) unsigned NOT NULL,
  `sku` varchar(100) NOT NULL,
  `color` varchar(60) DEFAULT NULL,
  `size` varchar(100) DEFAULT NULL,
  `material` varchar(100) DEFAULT NULL,
  `price` bigint(20) NOT NULL,
  `sale_price` bigint(20) DEFAULT NULL,
  `stock_quantity` bigint(20) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_product_variants_sku` (`sku`),
  UNIQUE KEY `uq_var_combo` (`product_id`,`color`,`size`,`material`),
  KEY `idx_var_product` (`product_id`),
  KEY `idx_product_variants_product_id` (`product_id`),
  CONSTRAINT `fk_products_variants` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_var_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,'BAN-COASTAL-NAT-120','Gỗ tự nhiên','120x60 cm','Gỗ sồi',3200000,2990000,15,1,'2026-10-08 10:42:39.000','2026-10-15 13:01:02.231'),(2,1,'BAN-COASTAL-NAT-140','Gỗ tự nhiên','140x70 cm','Gỗ sồi',3800000,NULL,10,1,'2026-10-08 10:42:39.000','2026-10-15 13:01:02.232'),(3,1,'BAN-COASTAL-WAL-140','Nâu óc chó','140x70 cm','Gỗ sồi',4100000,NULL,6,1,'2026-10-08 10:42:39.000','2026-10-15 13:01:02.232'),(4,2,'BAN-BRIDGE-WHT-100','Trắng','Ø100 cm','Gỗ sồi nguyên khối',4500000,NULL,8,1,'2026-10-08 10:42:39.000','2026-10-15 12:56:46.251'),(5,2,'BAN-BRIDGE-WAL-120','Nâu óc chó','Ø120 cm','Gỗ sồi nguyên khối',5200000,4800000,10,1,'2026-10-08 10:42:39.000','2026-10-15 12:56:46.252'),(6,3,'GHE-COASTAL-GRY','Xám','45x50x85 cm','Vải + gỗ tần bì',5200000,5000000,18,1,'2026-10-08 10:42:39.000','2026-10-15 12:08:19.793'),(7,3,'GHE-COASTAL-BEI','Be','45x50x85 cm','Vải + gỗ tần bì',5200000,5000000,23,1,'2026-10-08 10:42:39.000','2026-10-15 12:08:19.794'),(8,3,'GHE-COASTAL-GRN','Xanh rêu','45x50x85 cm','Vải + gỗ tần bì',5200000,5000000,30,1,'2026-10-08 10:42:39.000','2026-10-15 12:08:19.794'),(9,4,'SOFA-SKAGEN-GRY-L','Xanh','280x160 cm','Vải nỉ',72800000,71900000,5,1,'2026-10-08 10:42:39.000','2026-10-15 12:03:05.338'),(10,4,'SOFA-SKAGEN-BEI-L','Xám','280x160 cm','Vải nỉ',62800000,NULL,5,1,'2026-10-08 10:42:39.000','2026-10-15 12:03:05.339'),(11,5,'GIUONG-BRIDGE-16','Nâu óc chó','1m6 x 2m','Gỗ óc chó',8900000,NULL,5,1,'2026-10-08 10:42:39.000','2026-10-15 11:56:49.052'),(12,5,'GIUONG-BRIDGE-18','Nâu óc chó','1m8 x 2m','Gỗ óc chó',9900000,NULL,4,1,'2026-10-08 10:42:39.000','2026-10-15 11:56:49.054'),(13,6,'DEN-ARC-BLK','Đen','Cao 180 cm','Kim loại',1450000,NULL,23,1,'2026-10-08 10:42:39.000','2026-10-15 11:52:08.864'),(14,6,'DEN-ARC-GLD','Vàng đồng','Cao 180 cm','Kim loại',1590000,1390000,18,1,'2026-10-08 10:42:39.000','2026-10-15 11:52:08.865'),(15,7,'SF-NAU-2M','Nâu','2m','Da',15900000,NULL,0,1,'2026-10-08 22:34:36.000','2026-10-15 11:47:44.794'),(16,7,'SF-DEN-2M4','Đen','2m4','Da',19000000,NULL,5,1,'2026-10-08 22:34:36.000','2026-10-15 11:47:44.796'),(17,8,'SF-NAU-2M-NEW','Nau','2m','Da',8500000,NULL,10,1,'2026-10-09 10:35:56.000','2026-10-15 11:46:07.259'),(18,8,'SF-DEN-2M4-NEW','Den','2m4','Da',10500000,NULL,5,1,'2026-10-09 10:35:56.000','2026-10-15 11:46:07.260'),(19,1,'TEST-SKU-ORDER-120252',NULL,NULL,NULL,500000,NULL,10,0,'2026-10-09 12:02:52.644','2026-10-15 13:01:02.229'),(20,1,'TEST-SKU-ORDER-121705',NULL,NULL,NULL,500000,NULL,10,0,'2026-10-09 12:17:05.788','2026-10-15 13:01:02.230'),(21,9,'SOFA-COASTAL','Powder Blue','290x80','Gỗ Ash - nệm bọc vải',45000000,NULL,5,1,'2026-10-15 13:09:22.082','2026-10-15 13:39:06.467'),(22,10,'SOFA-QUEENS','Xám ghi','290x80','ỗ bọc da E spirit Taupe cao cấp',219900000,NULL,4,1,'2026-10-15 13:23:20.911','2026-10-15 13:23:20.911'),(23,10,'SOFA-QUEENS-2','Trắng','290x80','ỗ bọc da E spirit Taupe cao cấp',219900000,NULL,5,1,'2026-10-15 13:23:20.914','2026-10-15 13:23:20.914'),(24,11,'DF','sfs','fdfe','dfdf',1000000,NULL,10,1,'2026-10-15 14:34:37.740','2026-10-15 14:34:37.740'),(25,12,'BAN-AN','Be','180x60','Gỗ Ash kết hợp MDF phủ veneer Ash, hoàn thiện sơn',25000000,NULL,10,1,'2026-10-15 14:37:31.013','2026-10-15 14:37:31.013'),(26,13,'BAN-AN-OAK',NULL,'180x60','Gỗ sồi - Chân thép sơn',20000000,NULL,10,1,'2026-10-15 14:44:12.304','2026-10-15 14:44:12.304'),(27,14,'BAN-AN-CAMEO','Đen','200x100x75','Ceramic, kim loại.',190000000,180000000,10,1,'2026-10-15 14:57:52.682','2026-10-15 14:57:52.682'),(28,15,'BAN-AN-MAY','Gỗ tự nhiên','160x60x75','Mây mắt cáo nhân tạo, gỗ beech & MDF veneer beech.',18900000,18490000,10,1,'2026-10-15 15:04:00.691','2026-10-15 15:04:00.691'),(29,15,'BAN-AN-MAY-2','Gỗ tự nhiên','220x70x75','Mây mắt cáo nhân tạo, gỗ beech & MDF veneer beech.',23900000,23490000,10,1,'2026-10-15 15:04:00.693','2026-10-15 15:04:00.693'),(30,16,'BAN-AN-TAURA','Trắng ngọc trai','200x70x75','Ash Veneer',40000000,NULL,10,1,'2026-10-15 15:13:24.310','2026-10-15 15:13:24.310'),(31,16,'BAN-AN-TAURA-2','Đen','220x70x75','Ash Veneer',37900000,36999000,10,1,'2026-10-15 15:13:24.335','2026-10-15 15:13:24.335'),(32,16,'BAN-AN-TAURA-3','Xám','200x70x75','Ash Veneer',37900000,37000000,10,1,'2026-10-15 15:13:24.343','2026-10-15 15:13:24.343'),(33,17,'BAN-AN-TAN','Trắng ngọc trai','200x100x75','Đá Hồng Ngọc Long nhân tạo',115000000,112998000,6,1,'2026-10-15 15:20:17.213','2026-10-15 15:20:17.213'),(34,18,'GHE-ARMCHAIR','Xanh lá','80x75x67','Chân kim loại, khung xương ván ép, lò xo túi, mút bọc vải Tana Green 500',14900000,NULL,15,1,'2026-10-15 15:27:24.806','2026-10-15 15:27:24.806'),(35,19,'GHE-JUPITER','Nâu','87x82x60','100% Polyester. Vải 6D6U Brown.',18990000,NULL,10,1,'2026-10-15 15:35:07.513','2026-10-15 15:35:07.513'),(36,20,'GHE-VICTORIA','Hồng','70x90x75','Khung gỗ Ash, bọc vải Linen Rosy',26500000,NULL,10,1,'2026-10-15 15:50:51.216','2026-10-15 15:52:49.519'),(37,20,'GHE-VICTORIA-2','Xanh bầu trời','70x90x75','Khung gỗ Ash, bọc vải Linen Rosy',27000000,NULL,20,1,'2026-10-15 15:52:49.526','2026-10-15 15:52:49.526'),(38,20,'GHE-VICTORIA-3','Xám','70x90x75','Khung gỗ Ash, bọc vải Linen Rosy',26500000,NULL,15,1,'2026-10-15 15:52:49.528','2026-10-15 15:52:49.528'),(39,21,'GIUONG-ROCHE','Nâu','200x180x70','Rust, Khung gỗ MFC, bọc vải màu',18000000,NULL,10,1,'2026-10-15 18:39:17.668','2026-10-15 18:39:17.668'),(40,22,'GIUONG-VICTORIA','Hồng','290x180x130','Gỗ Ash kết hợp MDF phủ veneer Ash, hoàn thiện sơn; mây nhân tạo sơn',48900000,48500000,10,1,'2026-10-15 18:44:32.341','2026-10-15 18:44:32.341'),(41,23,'GIUONG-PENNY','Xám','200x180x100','Khung gỗ MFC, bọc vải màu GREYMIST',18000000,NULL,10,1,'2026-10-15 18:49:42.706','2026-10-15 21:30:12.362'),(42,23,'GIUONG-PENNY-2','Trắng','200x180x100','Khung gỗ MFC, bọc vải màu GREYMIST',18500000,NULL,10,1,'2026-10-15 18:49:42.707','2026-10-15 21:30:12.363'),(43,24,'GIUONG-ONA','Nâu','200x180x100','Gỗ sồi tự nhiên, bọc da bò màu nâu',69900000,NULL,15,1,'2026-10-15 19:14:34.807','2026-10-15 19:14:34.807'),(44,24,'GIUONG-ONA-2','Trắng','200x180x100','Khung gỗ MFC, bọc vải màu GREYMIST',69900000,NULL,10,1,'2026-10-15 19:14:34.808','2026-10-15 19:14:34.808'),(45,25,'GIUONG-PIO','Xám trắng','200x180x100','Gỗ beech - Bọc vải',25900000,NULL,20,1,'2026-10-15 19:19:58.468','2026-10-15 19:19:58.468'),(46,25,'GIUONG-PIO-2','Nâu','200x180x100','Gỗ beech - Bọc vải',26000000,NULL,8,1,'2026-10-15 19:19:58.470','2026-10-15 19:19:58.470'),(47,26,'GIUONG-MAISON','Be','200x180x100','Kenli Signature',45000000,NULL,10,1,'2026-10-15 19:27:51.346','2026-10-15 19:27:51.346'),(48,27,'GIUONG-LANDA','Nâu','200x180x100','Chân kim loại sơn đen, nệm bọc vải cao cấp',35600000,35000000,10,1,'2026-10-15 19:32:25.395','2026-10-15 19:32:25.395'),(49,28,'TU-VICTORIA','Trắng','180x70x210 cm','Gỗ Ash kết hợp MDF phủ veneer Ash, hoàn thiện sơn',30000000,NULL,20,1,'2026-10-15 19:37:59.249','2026-10-15 19:38:33.886'),(50,29,'TU-GENIE-VACT','Nâu( họa tiết)','150x70x200','Khung kim loại bọc vải cao cấp',29900000,NULL,7,1,'2026-10-15 19:45:23.172','2026-10-15 19:45:23.172'),(51,30,'TU-ACRYLIC','Trắng xanh','160x60x200cm','Thùng MFC chống ẩm - mặt MDF Acrylic Parc50',34000000,NULL,15,1,'2026-10-15 19:50:10.740','2026-10-15 19:50:10.740'),(52,31,'TU-MAXINE','Nâu','120x60x200cm','Khung gỗ Okumi, MDF veneer recon Walnut, chân inox mạ PVD màu gold',20000000,NULL,19,1,'2026-10-15 19:55:18.635','2026-10-15 19:55:18.635'),(53,32,'BAN-LAM-VIEC','Nâu','200x180x100','Kim loại',5000,NULL,18,1,'2026-10-17 23:36:29.360','2026-10-28 10:39:34.140'),(54,1,'TEST-SKU-ORDER-232303',NULL,NULL,NULL,500000,NULL,10,1,'2026-10-22 23:23:03.341','2026-10-22 23:23:03.341');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã sản phẩm',
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `brand_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `short_desc` text DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `base_price` bigint(20) DEFAULT NULL,
  `sale_price` bigint(20) DEFAULT NULL,
  `warranty` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `is_featured` tinyint(1) DEFAULT NULL,
  `view_count` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_products_slug` (`slug`),
  UNIQUE KEY `idx_products_sku` (`sku`),
  KEY `idx_prod_cat_status` (`category_id`,`status`),
  KEY `idx_prod_featured` (`status`,`is_featured`),
  KEY `idx_prod_deleted` (`deleted_at`),
  KEY `fk_products_brand` (`brand_id`),
  KEY `idx_products_deleted_at` (`deleted_at`),
  FULLTEXT KEY `ft_prod_name` (`name`),
  CONSTRAINT `fk_prod_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prod_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,1,'Bàn Làm Việc Coastal','ban-lam-viec-coastal','BAN-COASTAL','Bàn làm việc chắc chắn, sang trọng.','<p>Coastal mang đậm chất Việt khi khéo léo dung hòa được những nét đẹp lấy cảm hứng từ miền duyên hải nước ta với các vật liệu cao cấp, lối thiết kế hiện đại. Bàn làm việc Coastal có thiết kế độc đáo với phần tủ kéo cong mang đến không gian làm việc sáng tạo và độc đáo. Chất liệu gỗ Ash vừa đáp ứng tính thẩm mỹ, đồng thời là vật liệu bền bỉ theo thời gian. Khi kết hợp bàn làm việc cùng ghế ăn Coastal sẽ tạo nên góc làm việc cực kỳ thoải mái và tiện nghi.</p>',3200000,2990000,'tháng','active',1,2,'2026-10-08 10:42:39.000','2026-10-15 13:01:02.221',NULL),(2,1,3,'Bàn Ăn Bridge Tròn','ban-an-tron-bridge','BAN-BRIDGE','Bàn ăn tròn mặt gỗ, chân','<p><strong>Bàn ăn tròn Bridge</strong> được chế tác từ gỗ sồi nguyên khối với thiết kế tối giản, loại bỏ chi tiết thừa để tôn lên vẻ đẹp tự nhiên của vân gỗ. Cấu trúc không thanh đỡ giúp không gian dưới bàn thoáng, dễ dàng bố trí ghế gọn gàng.</p>',4500000,NULL,'6 tháng','active',0,2,'2026-10-08 10:42:39.000','2026-10-15 12:56:46.244',NULL),(3,2,3,'Ghế Ăn Coastal','ghe-an-coastal','GHE-COASTAL','Ghế ăn vải êm, chân gỗ tần bì.','<p><strong>Ghế ăn Coastal</strong>&nbsp;bằng gỗ màu tự nhiên. Phong cách ven biển nhẹ nhàng cho phòng ăn. Mua ngay để làm mới không gian sống! Tóm lại: Một chiếc ghế gỗ mang phong cách ven biển, phù hợp cho những bạn thích sự nhẹ nhàng và tối giản.</p>',5200000,5000000,'6 tháng','active',1,0,'2026-10-08 10:42:39.000','2026-10-15 12:08:19.787',NULL),(4,3,2,'Sofa Skagen','sofa-goc-chu-l-skagen','SOFA-SKAGEN','Sofa Skagen mang phong cách cổ điển, sang trọng, lịch lãm.','<p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"gs_mdlink\" href=\"https://skagenstudio.com/\">Sofa Skagen là một sản phẩm cao cấp với thiết kế hiện đại và sự kết hợp hoàn hảo giữa sự thoải mái và tính thẩm mỹ. Sofa Skagen được chế tác từ chất liệu cao cấp, mang lại trải nghiệm ngồi thoải mái và êm ái. Sản phẩm này không chỉ mang lại sự thoải mái mà còn thể hiện phong cách và sự sang trọng của người sử dụng.</a></p>',62800000,NULL,'24 tháng','active',1,0,'2026-10-08 10:42:39.000','2026-10-15 12:03:05.333',NULL),(5,4,1,'Giường Bridge 1M8','giuong-ngu','GIUONG-1M8','Giường ngủ êm , đầu giường bọc nệm.','<p><strong>Giường Bridge 1m8</strong> Da Bò R1 DB màu nâu sang trọng. Chất liệu da bò bền bỉ, thiết kế hiện đại cho phòng ngủ. Mua ngay để nâng tầm không gian! Tóm lại: Một chiếc <strong>giường</strong> kích thước lớn bọc da bò mang lại vẻ ngoài sang trọng và cảm giác vững chãi cho phòng ngủ của bạn.</p>',8900000,NULL,'24 tháng','active',0,7,'2026-10-08 10:42:39.000','2026-10-15 11:56:49.046',NULL),(6,7,2,'Đèn Bàn Savona','den-cay-dung-arc','DEN-ARC','Đèn trang trí phòng ngủ, sang trọng, cổ điển, đẹp.','<p>Thêm điểm nhấn về kết cấu cho mặt bàn của bạn với Đèn bàn Savona tinh xảo, có đế đèn bằng sứ trắng có chạm khắc hình xoắn ốc. Vẻ ngoài đặc biệt của nó được thể hiện bởi đế đèn hoàn thiện bằng đồng cổ và một chao đèn màu kem đơn giản.</p>',1590000,1390000,'6 tháng','active',0,5,'2026-10-08 10:42:39.000','2026-10-15 11:52:08.858',NULL),(7,3,NULL,'Sofa Porto 3 Chỗ 2M2','sofa-da-cao-cap-phong-khach','SOFA-PHONG-KHACH','Sofa Porto da 3 chỗ hiện đại mẫu VACT10509 với đường may tinh tế gấp nếp hai bên tay sofa mang lại cảm giác dễ chịu cho không gian phòng khách. Điểm nhấn của sofa là inox mạ gold trang trí bên thành sofa rất vững chắc.','<p><strong>Bảo quản</strong><br><strong>Phần kim loại:</strong> Lau bụi bằng khăn mềm. Khi cần vệ sinh, sử dụng khăn hơi ẩm với dung dịch làm sạch trung tính và lau khô ngay. Không sử dụng dung môi hoặc chất tẩy mạnh.<br><br><strong>Phần da:</strong> Hút bụi định kỳ và vệ sinh bề mặt bằng chổi lông mềm hoặc khăn cotton mềm hơi ẩm, sau đó lau lại bằng khăn khô. Tránh để nước, dầu mỡ, mực bút hoặc các chất bẩn thấm vào da. Sử dụng sản phẩm bảo dưỡng da chuyên dụng phù hợp với từng loại da định kỳ khoảng 2–4 lần/năm. Không đặt giấy báo trực tiếp lên bề mặt da.</p>',15900000,NULL,'12 tháng','active',1,33,'2026-10-08 22:34:36.000','2026-10-15 11:47:44.789',NULL),(8,3,NULL,'Sofa 3 Chỗ Moretti II Titanium','sofa-da-cao-cap-phong-khach-2','SOFA-PHONG-KHACH-NEW','Sofa 3 chỗ Moretti II là sự cân bằng đầy tinh tế giữa tỷ lệ và công năng. Mặt ngồi được hạ thấp khéo léo, kết hợp cùng tựa lưng cao nâng đỡ trọn vẹn dáng ngồi, trong khi hệ đệm nhiều lớp mang lại cảm giác êm ái, mềm mại trong từng khoảnh khắc thư giãn.','<p><strong>Bảo quản</strong><br><strong>Phần kim loại:</strong> Lau bụi bằng khăn mềm. Khi cần vệ sinh, sử dụng khăn hơi ẩm với dung dịch làm sạch trung tính và lau khô ngay. Không sử dụng dung môi hoặc chất tẩy mạnh.<br><br><strong>Phần da:</strong> Hút bụi định kỳ và vệ sinh bề mặt bằng chổi lông mềm hoặc khăn cotton mềm hơi ẩm, sau đó lau lại bằng khăn khô. Tránh để nước, dầu mỡ, mực bút hoặc các chất bẩn thấm vào da. Sử dụng sản phẩm bảo dưỡng da chuyên dụng phù hợp với từng loại da định kỳ khoảng 2–4 lần/năm. Không đặt giấy báo trực tiếp lên bề mặt da.</p>',8500000,NULL,'12 tháng','active',1,10,'2026-10-09 10:35:56.000','2026-10-15 11:46:07.256',NULL),(9,3,2,'Sofa Coastal Góc Phải 2M9 (Màu Powder Blue Vact7502)','sofa-goc-coastal','SOFA-COASTAL','Ghế Sofa Coastal êm ái, trẻ trung, sang trọng, lịch lãm.','<p>Sofa COASTAL – Sofa Da Hiện Đại Tinh Tế Cho Phòng Khách Trẻ Trung (Hàng Order) được <strong>sản xuất từ chất liệu cao cấp, khung gỗ tự nhiên chắc chắn, đệm mút D40 siêu đàn hồi</strong>. Bề mặt bọc da/vải nhập khẩu bền đẹp, dễ vệ sinh, phù hợp với khí hậu Việt Nam.</p>',45000000,NULL,'12 tháng','active',0,4,'2026-10-15 13:09:22.077','2026-10-15 13:39:06.464',NULL),(10,3,2,'Sofa Queens Góc Trái 2M9 (Taupe Leather D04)','sofa-goc-queens','SOFA-QUEENS','Ghế sofa Queens được thiết kế với những đường nét cong được ưa chuộng trong tỷ lệ và các chi tiết hoa văn.','<p>Ghế sofa Queens được thiết kế với những đường nét cong được ưa chuộng trong tỷ lệ và các chi tiết hoa văn. Nhờ tay vịn đôi và đệm, sản phẩm mang lại cảm giác mềm mại và thoải mái, mang lại cảm giác nhẹ nhàng bởi chân gỗ tần bì mỏng nhiều mặt. Nhờ vào sự phóng khoáng trong thiết kế, sản phẩm mang đến sự thoải mái, và phù hợp với mọi thành viên nhưng vẫn giữ sự ấm cúng của một chiếc sofa gia đình</p>',219900000,NULL,'12 tháng','active',1,0,'2026-10-15 13:23:20.906','2026-10-15 13:23:20.906',NULL),(11,1,2,'SOFA','sfsf','SFDF','fdf','<p>fdf</p>',1000000,NULL,'12 tháng','active',0,0,'2026-10-15 14:34:37.733','2026-10-15 14:34:37.733','2026-10-15 14:34:50.465'),(12,1,1,'Bàn Ăn Victoria II 1M8','ban-an-vitcoria','BAN-AN-VICTORIA','Bàn ăn Victoria II 1M8 sở hữu mặt bàn thanh thoát cùng phần chân chạm tinh tế, phù hợp từ những bữa ăn thường ngày đến các dịp sum họp. Yếm bàn và những đường cong bo tròn mang cảm hứng Pháp lãng mạn, tạo nét mềm mại và ấm áp cho không gian phòng ăn.','<p>Bàn ăn Victoria II 1M8 sở hữu mặt bàn thanh thoát cùng phần chân chạm tinh tế, phù hợp từ những bữa ăn thường ngày đến các dịp sum họp. Yếm bàn và những đường cong bo tròn mang cảm hứng Pháp lãng mạn, tạo nét mềm mại và ấm áp cho không gian phòng ăn.</p>',25000000,NULL,'12 tháng','active',0,1,'2026-10-15 14:37:31.009','2026-10-15 14:37:31.009',NULL),(13,1,1,'Bàn Ăn Oak 6 Chỗ 1,8M','ban-an-oak','BAN-AN-OAK','Bộ sản phẩm gồm 1 bàn ăn kích thước 1,8m x 90cm đi kèm 6 ghế, mặt bàn sử dụng đá tự nhiên, chân bàn thép cao cấp, ghế bọc da cao cấp với chân sắt sơn tĩnh điện. Sản phẩm có xuất xứ Đài Loan, bảo hành 1 năm tại Nội thất Tân Á.','<p>Bàn ăn gỗ sồi Oak với thiết kế thanh lịch mang đến một không gian phòng ăn sang trọng. Chân trụ tròn đỡ mặt bàn bằng gỗ sồi ghép kết hợp thép mạ màu gold tạo thành một khối hài hòa vững chắc. Mặt bàn bằng gỗ veneer sồi vẫn giữ màu sáng, vân gỗ được chọn lọc kỹ đều và tinh tế.</p>',20000000,NULL,'12 tháng','active',0,1,'2026-10-15 14:44:12.295','2026-10-15 14:44:12.295',NULL),(14,1,2,'Bàn Ăn Cameo 8 Chỗ','ban-an-cameo','BAN-AN-CAMEO','Bàn ăn CAMEO là một sản phẩm nội thất cao cấp và sang trọng, phù hợp với những không gian phòng ăn hiện đại và lịch sự. Bàn có mặt bằng đá ceramic chống thấm ố và dễ lau chùi, chân bằng sắt sơn tĩnh điện màu đen, mâm đế bằng inox mạ sáng bóng và chắc chắn.','<p><strong>Màu sắc:</strong> Đen<br><strong>Chất liệu:</strong> Ceramic, kim loại.<br><strong>Bảo quản:</strong> Chỉ giặt khô, tránh đặt nơi ẩm thấp hoặc có ánh nắng trực tiếp. Lau chân ghế bằng khăn ẩm; không dùng hóa chất tẩy rửa để tránh hỏng lớp hoàn thiện.</p>',190000000,180000000,'12 tháng','active',0,0,'2026-10-15 14:57:52.676','2026-10-15 14:57:52.676',NULL),(15,1,1,'Bàn Ăn Mây II','ban-an-may','BAN-AN-MAY','Bàn ăn Mây II gây ấn tượng với phần chân bàn tạo hình độc đáo hoàn toàn từ gỗ Beech tự nhiên, điểm xuyết chi tiết mây đan tạo nên nét riêng biệt cho tổng thể thiết kế. Các góc bàn được bo tròn mềm mại, vừa mang lại cảm giác dễ chịu khi sử dụng vừa an toàn cho gia đình có trẻ nhỏ.','<p>Bàn ăn Mây II gây ấn tượng với phần chân bàn tạo hình độc đáo hoàn toàn từ gỗ Beech tự nhiên, điểm xuyết chi tiết mây đan tạo nên nét riêng biệt cho tổng thể thiết kế. Các góc bàn được bo tròn mềm mại, vừa mang lại cảm giác dễ chịu khi sử dụng vừa an toàn cho gia đình có trẻ nhỏ. Sản phẩm có 2 kích thước 1m6 và 2m2 để tăng thêm lựa chọn, phù hợp cho nhiều không gian khác nhau.</p>',18900000,18490000,'12 tháng','active',0,0,'2026-10-15 15:04:00.685','2026-10-15 15:04:00.685',NULL),(16,1,1,'Bàn Ăn Taura 8 Chỗ E0202 Éponji 2M','ban-an-taura','BAN-AN-TAURA','Bàn ăn 8 ghế hình chữ nhật chuẩn dài 200-220cm, rộng 70-100cm, cao 75cm, căn phòng tối thiểu 3,2-3,5m.','<p>Bộ bàn ăn  cổ điển mang ý nghĩa tượng trưng cho sự&nbsp;sang trọng, đẳng cấp và nét đẹp vượt thời gian, kết hợp hài hòa giữa phong cách cổ điển và hiện đại. Không chỉ là nơi quây quần, nó còn giúp&nbsp;tăng tính thẩm mỹ&nbsp;cho không gian sống, tạo điểm nhấn ấn tượng, đồng thời thể hiện sự tinh tế và gu thẩm mỹ của gia chủ.</p>',37900000,36999000,'6 tháng','active',0,0,'2026-10-15 15:13:24.272','2026-10-15 15:13:24.272',NULL),(17,1,2,'Bộ Bàn Ăn Tân Cổ Điển 2M Élanoire 8 Ghế','ban-an-tan','BAN-AN-TAN','Bàn ăn tân cổ điển mang phong cách sang trọng, đẳng cấp và quyền lực.','<p>Bộ bàn ăn tân cổ điển mang ý nghĩa tượng trưng cho sự&nbsp;sang trọng, đẳng cấp và nét đẹp vượt thời gian, kết hợp hài hòa giữa phong cách cổ điển và hiện đại. Không chỉ là nơi quây quần, nó còn giúp&nbsp;tăng tính thẩm mỹ&nbsp;cho không gian sống, tạo điểm nhấn ấn tượng, đồng thời thể hiện sự tinh tế và gu thẩm mỹ của gia chủ.</p>',115000000,112998000,'12 tháng','active',0,0,'2026-10-15 15:20:17.207','2026-10-15 15:20:17.207',NULL),(18,2,2,'Ghế Armchair Flow Green','ghe-armchair','GHE-ARMCHAIR','Armchair Flow Green là một bộ sưu tập ghế được thiết kế bởi Jean Marie Massaud vào năm 2009, nổi bật với các đường cong và sự sang trọng của nó. Ghế Flow được làm từ các vật liệu bền bỉ, bao gồm polycarbonate tái chế và gỗ có nguồn gốc bền vững, đảm bảo sự thoải mái và an toàn cho người sử dụng. Bộ sưu tập này không chỉ phù hợp với không gian văn phòng mà còn mang lại vẻ đẹp hiện đại cho không gian sống của bạn.','<p><strong>Sản phẩm bao gồm:</strong> Armchair kèm 1 gối<br><strong>Màu sắc:</strong> Xanh lá<br><strong>Chất liệu:</strong> Chân kim loại, khung xương ván ép, lò xo túi, mút bọc vải Tana Green 500<br><strong>Bảo quản:</strong> Chỉ giặt khô, tránh đặt nơi ẩm thấp hoặc có ánh nắng trực tiếp. Lau chân ghế bằng khăn ẩm; không dùng hóa chất tẩy rửa để tránh hỏng lớp hoàn thiện.</p>',14900000,NULL,'6 tháng','active',0,1,'2026-10-15 15:27:24.800','2026-10-15 15:27:24.800',NULL),(19,2,2,'Ghế Armchair Jupiter','ghe-jupiter','GHE-JUPITER','Ghế Armchair Jupiter mang lại sự trẻ trung, sang trọng, cổ điển. Ghế bành Jupiter, năm 1966 Pierre Guariche đã phát triển một loạt thiết kế xoay quanh một khối ghế duy nhất với hình dáng tròn trịa và thân thiện.','<p>Một chiếc ghế có lưng tựa cao . Lấy cảm hứng từ việc chinh phục không gian và những đổi mới kỹ thuật, chẳng hạn như việc sử dụng polyurethane giãn nở, để phục vụ cho ý tưởng của mình, hình dáng của Jupiter đã trở thành hiện thực.</p>',18990000,NULL,'6 tháng','active',0,1,'2026-10-15 15:35:07.508','2026-10-15 15:35:07.508',NULL),(20,2,2,'Armchair Victoria II Màu Rosy','ghe-victoria','GHE-VICTORIA','Armchair Victoria, mẫu ghế bành một chỗ với tựa lưng cao và dáng ôm, có thể dùng độc lập hoặc phối cùng sofa để tạo bộ ghế phòng khách đồng bộ. Sản phẩm được sơn lau màu thủ công, giúp bề mặt gỗ có chiều sâu và sắc độ riêng cho mỗi chiếc ghế.','<p>Armchair Victoria, mẫu ghế bành một chỗ với tựa lưng cao và dáng ôm, có thể dùng độc lập hoặc phối cùng sofa để tạo bộ ghế phòng khách đồng bộ. Sản phẩm được sơn lau màu thủ công, giúp bề mặt gỗ có chiều sâu và sắc độ riêng cho mỗi chiếc ghế.</p>',26500000,NULL,'6 tháng','active',0,1,'2026-10-15 15:50:51.205','2026-10-15 15:52:49.508',NULL),(21,4,3,'Giường Roche 1M8 Vải Rust','giuong-roche','GIUONG-ROCHE','Giường bọc nệm 1m8x2m được làm từ chất liệu vải nhung mềm mại êm ái mang đến phong cách sang trọng, tinh tế. – Khung giường ngủ bọc nhung được làm từ chất liệu gỗ đã được xử lí chống cong vênh, mối mọt. Gỗ có độ cứng cao, chắc chắn.','<p></p><p><strong>Chất liệu da bò thật và vải Rust</strong> cao cấp, thiết kế hiện đại, mang lại giấc ngủ êm ái và đẳng cấp cho không gian phòng ngủ của bạn. Thiết kế hiện đại, tinh giản, chú trọng vào sự cân bằng và công năng. Phù hợp cho những không gian tối giản nhưng vẫn yêu cầu sự sang trọng và tinh tế.</p>',18000000,NULL,'12 tháng','active',0,0,'2026-10-15 18:39:17.664','2026-10-15 18:39:17.664',NULL),(22,4,3,'Giường Victoria II','giuong-victoria','GIUONG-VICTORIA','Giường Victoria II nổi bật với đầu giường cong cao kết hợp chi tiết đan mây nhân tạo, tạo cảm giác lãng mạn và thanh lịch nhưng không nặng nề.','<p>Giường Victoria II nổi bật với <strong>đầu giường cong cao kết hợp chi tiết đan mây nhân tạo</strong>, tạo cảm giác lãng mạn và thanh lịch nhưng không nặng nề. Khung giường gỗ Ash tự nhiên phù hợp với phòng ngủ master theo phong cách Refined French Country.</p>',48900000,48500000,'12 tháng','active',0,1,'2026-10-15 18:44:32.338','2026-10-15 18:44:32.338',NULL),(23,4,3,'Giường Penny 1M8 Hộc Kéo Greymist','giuong-penny','GIUONG-PENNY','Giường hộc kéo Penny 1m8 với điểm nổi bật là bốn ngăn chứa đồ rộng thuận tiện cất những vật dụng trong phòng ngủ như gối, mền, drap hết sức gọn gàng.','<p>Giường hộc kéo Penny 1m8 với điểm nổi bật là <strong>bốn ngăn chứa đồ rộng thuận tiện cất những vật dụng trong phòng ngủ như gối, mền, drap hết sức gọn gàng</strong>. Chắc chắn sẽ là sự lựa chọn tối ưu cho không gian phòng ngủ hiện đại. Giường hộc kéo Penny có 2 kích thước 1m6 và 1m8, đa dạng màu sắc.</p>',18000000,NULL,'12 tháng','active',0,0,'2026-10-15 18:49:42.704','2026-10-15 21:30:12.352',NULL),(24,4,3,'Giường Ona Him 1M8 Da Bò Nâu','giuong-ona','GIUONG-ONA','Giường ngủ 1m8 gỗ tự nhiên màu nâu nhạt, thiết kế khung gỗ bản dày liền khối với chân chữ U, tựa đầu bọc da trắng kẻ sọc dọc, mang đến không gian phòng ngủ hiện đại, sang trọng và tiện nghi.','<p><strong>Giường ngủ 1m8</strong> là lựa chọn hoàn hảo cho những gia đình muốn sở hữu một không gian nghỉ ngơi vừa sang trọng vừa tiện nghi. Thiết kế khung hình chữ nhật chắc chắn với các thanh gỗ bản dày liền khối cùng chân giường chữ U mang đến sự vững chãi và bền bỉ. Các góc cạnh giường được bo tròn mềm mại, vừa an toàn khi sử dụng, vừa tạo nên nét thanh thoát trong tổng thể thiết kế.</p>',69900000,NULL,'12 tháng','active',0,4,'2026-10-15 19:14:34.803','2026-10-15 19:14:34.803',NULL),(25,4,1,'Giường Pio 1M8 Vải','giuong-pio','GIUONG-PIO','Giường Pio được thiết kế bọc vải hoàn toàn với khung gỗ beech chắc chắn. Những chi tiết nhấn nhá tại đầu giường, gối đầu giường giúp nó trở nên lạ mắt và ấn tượng. Sử dụng chân thon gọn giúp phòng ngủ của bạn trở nên thông thoáng và thanh lịch hơn. Giường Pio có các màu vải khác nhau để lựa chọn.','<p>Giường ngủ bọc vải Pio 1m6 màu 10/WV094 được thiết kế bọc vải hoàn toàn với khung gỗ beech chắc chắn. Những chi tiết nhấn nhá tại đầu giường, gối đầu giường giúp nó trở nên lạ mắt và ấn tượng. Sử dụng chân thon gọn giúp phòng ngủ của bạn trở nên thông thoáng và thanh lịch hơn. Giường Pio là một lựa chọn sáng giá cho không gian phòng ngủ Bắc Âu- Hiện đại, với 2 kích thước lựa chọn: 1m6, 1m8, có các màu vải khác nhau để lựa chọn.</p>',25900000,NULL,'12 tháng','active',0,0,'2026-10-15 19:19:58.465','2026-10-15 19:19:58.465',NULL),(26,4,2,'Giường bọc da MAISON','giuong-maison','GIUONG-MAISON','Sở hữu đường nét tối giản nhưng đầy gợi cảm, giường MAISON tạo nên một vòng ôm ấm áp cả về thẩm mỹ lẫn công năng sử dụng. Đầu giường bo cong, lót thêm đệm lưng dày được tính toán tỉ mỉ, mở ra không gian tôn vinh trọn vẹn sự gần gũi của một vòng tay thân thuộc.','<p>Sở hữu đường nét tối giản nhưng đầy gợi cảm, giường MAISON tạo nên một vòng ôm ấm áp cả về thẩm mỹ lẫn công năng sử dụng. Đầu giường bo cong, lót thêm đệm lưng dày được tính toán tỉ mỉ, mở ra không gian tôn vinh trọn vẹn sự gần gũi của một vòng tay thân thuộc.</p>',45000000,NULL,'12 tháng','active',0,2,'2026-10-15 19:27:51.342','2026-10-15 19:27:51.342',NULL),(27,4,2,'Giường Landa 1M8 Grey Fabric','giuong-landa','GIUONG-LANDA','Giường ngủ đơn giản 1m8 là mẫu giường ngủ hiện đại, sở hữu thiết kế tối giản nhưng vẫn toát lên vẻ sang trọng, tinh tế, phù hợp với nhiều phong cách nội thất phòng ngủ. Với đường nét gọn gàng và màu sắc trang nhã, sản phẩm mang đến không gian nghỉ ngơi ấm cúng, thoải mái và hiện đại.','<p>Đặc tính sản phẩm và chất liệu gỗ: Sản phẩm được làm từ veneer xoan đào đã qua xử lý chống cong vênh, chống mọt đảm bảo độ bền cho sản phẩm. Trên đầu <strong>giường</strong> được thiết kế 2 hộc lớn chứa đủ chăn, gối và mền, cánh cửa hộc gắn bản lề, mở ra vô được.</p>',35600000,35000000,'12 tháng','active',0,1,'2026-10-15 19:32:25.390','2026-10-15 19:32:25.390',NULL),(28,5,1,'Tủ Áo Victoria II 1M8','tu-victoria','TU_VICTORIA','Tủ áo Victoria II 1M8 sở hữu thiết kế chắc chắn và không gian lưu trữ rộng rãi, phù hợp cho phòng ngủ master. Các chi tiết chân tiện, phào và tay nắm kim loại giả cổ được lặp lại tinh tế, tạo sự đồng bộ và nét trang nhã cho không gian phòng ngủ.','<p>Lau sạch bụi bằng khăn mềm, khô hoặc hơi ẩm. Khi có nước hoặc chất lỏng đổ lên bề mặt, thấm và lau khô ngay, tránh chà xát mạnh. Không sử dụng chất tẩy rửa mạnh hoặc sản phẩm có chứa cồn và hóa chất có thể ảnh hưởng đến lớp hoàn thiện.</p>',30000000,NULL,'12 tháng','active',0,2,'2026-10-15 19:37:59.238','2026-10-15 19:38:33.881',NULL),(29,5,2,'Tủ Genie Vact','tu-genie-vact','TU-GENIE_VACT','Tủ Genie Vact là mẫu tủ phòng ăn thuộc dòng nội thất Nhà Xinh, nổi bật với thiết kế tinh gọn, vật liệu cao cấp và quy trình kiểm tra chất lượng nghiêm ngặt từ nguyên liệu đến sản phẩm hoàn thiện.','<h3><strong>Thiết kế &amp; vật liệu (mô tả theo tiêu chuẩn tủ phòng ăn cao cấp)</strong></h3><p>Dù nguồn không nêu chi tiết, các mẫu tủ phòng ăn của Nhà Xinh thường có những đặc điểm sau:</p><ul><li><p><strong>Khung tủ bằng gỗ tự nhiên hoặc MDF chống ẩm phủ veneer</strong>, đảm bảo độ bền và hạn chế cong vênh.</p></li><li><p><strong>Bề mặt hoàn thiện sơn hoặc phủ laminate</strong>, tạo cảm giác sang trọng và dễ vệ sinh.</p></li><li><p><strong>Cánh tủ dạng mở hoặc lùa</strong>, sử dụng bản lề giảm chấn để đóng mở êm ái.</p></li><li><p><strong>Ngăn chứa đa năng</strong>: ngăn lớn để đựng nồi – chén – ly, ngăn nhỏ để gia vị hoặc vật dụng bàn ăn.</p></li><li><p><strong>Kính cường lực</strong> (nếu có phần tủ trưng bày), giúp tăng thẩm mỹ và an toàn.</p></li></ul><p></p>',29900000,NULL,'6 tháng','active',0,0,'2026-10-15 19:45:23.168','2026-10-15 19:45:23.168',NULL),(30,5,1,'Tủ Áo Acrylic','tu-acrylic','TU-ACRYLIC','Tủ quần áo acrylic là nội thất hiện đại, ghi điểm bởi bề mặt sáng bóng sang trọng, độ bền vượt trội và khả năng mở rộng chiều sâu không gian. Sự kết hợp giữa cốt gỗ công nghiệp chống ẩm (như MDF lõi xanh) cùng lớp acrylic cao cấp kiến tạo nên một tổng thể sắc nét, hoàn mỹ.','<p>Tủ quần áo acrylic là <strong>loại tủ được làm từ chất liệu acrylic, một loại nhựa tổng hợp có độ bóng cao, khả năng chịu lực tốt và chống trầy xước hiệu quả</strong>. Bề mặt của tủ áo acrylic thường rất bóng mịn, tạo cảm giác sang trọng và dễ dàng vệ sinh.</p>',34000000,NULL,'12 tháng','active',0,2,'2026-10-15 19:50:10.733','2026-10-15 19:50:10.733',NULL),(31,5,1,'Tủ Áo Maxine','tu-maxine','TU-MAXINE','Tủ áo Maxine chứa đựng đầy đủ công năng tối ưu cho việc cất trữ quần áo bằng việc bố trí sắp xếp hợp lý các ngăn tủ. Những chi tiết về phụ kiện cao cấp giúp cho việc thao tác nhẹ nhàng. Bề ngoài, tủ được thiết kế duyên dáng và thu hút với sắc nâu trầm và kim loại đồng.','<p>Tủ áo Maxine chứa đựng đầy đủ công năng tối ưu cho việc cất trữ quần áo bằng việc bố trí sắp xếp hợp lý các ngăn tủ. Những chi tiết về phụ kiện cao cấp giúp cho việc thao tác nhẹ nhàng. Bề ngoài, tủ được thiết kế duyên dáng và thu hút với sắc nâu trầm và kim loại đồng. Maxine – Nét nâu trầm sang trọng Maxine, mang thiết kế vượt thời gian, gửi gắm và gói gọn lại những nét đẹp của thiên nhiên và con người nhưng vẫn đầy tính ứng dụng cao trong suốt hành trình phiêu lưu của nhà thiết kế người Pháp Dominique Moal. Bộ sưu tập nổi bật với màu sắc nâu trầm sang trọng, là sự kết hợp giữa gỗ, da bò và kim loại vàng bóng. Đặc biệt trên mỗi sản phẩm, những nét bo viên, chi tiết kết nối được sử dụng kéo léo tạo ra điểm nhất rất riêng cho bộ sưu tập. Maxine thể hiện nét trầm tư, thư giãn để tận hưởng không gian sống trong nhịp sống hiện đại. Sản phẩm thuộc BST Maxine được sản xuất tại Việt Nam.</p>',20000000,NULL,'12 tháng','active',0,7,'2026-10-15 19:55:18.625','2026-10-15 19:55:18.625',NULL),(32,1,NULL,'Bàn làm việc','ban-lam-viec','BAN-LAM-VIEC','không có','<p>không có</p>',5000,NULL,'12 tháng','active',0,21,'2026-10-17 23:36:29.352','2026-10-28 10:39:34.124',NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã token',
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'Của tài khoản nào',
  `token_hash` varchar(255) NOT NULL COMMENT 'Token đã mã hóa',
  `expires_at` datetime NOT NULL COMMENT 'Thời điểm hết hạn',
  `revoked_at` datetime DEFAULT NULL COMMENT 'Thời điểm bị thu hồi (khi đăng xuất)',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Ngày tạo',
  PRIMARY KEY (`id`),
  KEY `idx_rt_user` (`user_id`),
  KEY `idx_rt_hash` (`token_hash`(100)),
  CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token giữ đăng nhập';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã đánh giá',
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `rating` bigint(20) DEFAULT NULL,
  `comment` longtext DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `admin_note` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_product` (`user_id`,`product_id`),
  KEY `idx_rev_product` (`product_id`,`status`),
  CONSTRAINT `fk_rev_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rev_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,3,7,5,'San pham rat dep va chac chan!','pending','2026-10-09 12:09:16.153','2026-10-09 12:09:16.153',NULL),(2,4,7,5,'San pham rat dep va chac chan!','pending','2026-10-09 12:16:08.704','2026-10-09 12:16:08.704',NULL),(3,5,7,5,'San pham rat dep va chac chan!','pending','2026-10-09 12:18:24.665','2026-10-09 12:18:24.665',NULL),(4,6,7,5,'San pham rat dep va chac chan!','pending','2026-10-09 12:27:45.181','2026-10-09 12:27:45.181',NULL),(5,9,31,5,'San pham rat dep va chac chan!','pending','2026-10-17 21:53:27.097','2026-10-17 21:53:27.097',NULL),(6,13,32,5,'San pham rat dep va chac chan!','pending','2026-10-22 23:27:55.452','2026-10-22 23:27:55.452',NULL),(7,14,32,5,'San pham rat dep va chac chan!','pending','2026-10-22 23:28:10.364','2026-10-22 23:28:10.364',NULL),(8,15,32,5,'San pham rat dep va chac chan!','pending','2026-10-23 00:20:41.098','2026-10-23 00:20:41.098',NULL),(9,16,32,5,'San pham rat dep va chac chan!','pending','2026-10-23 00:39:32.954','2026-10-23 00:39:32.954',NULL);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sepay_transactions`
--

DROP TABLE IF EXISTS `sepay_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sepay_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sepay_id` bigint(20) DEFAULT NULL,
  `gateway` varchar(50) DEFAULT NULL,
  `transaction_date` varchar(50) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `sub_account` varchar(50) DEFAULT NULL,
  `transfer_type` varchar(20) DEFAULT NULL,
  `transfer_amount` bigint(20) DEFAULT NULL,
  `accumulated` bigint(20) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `reference_code` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `order_id` bigint(20) unsigned DEFAULT NULL,
  `status` varchar(30) DEFAULT 'matched',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_sepay_transactions_sepay_id` (`sepay_id`),
  KEY `idx_sepay_transactions_order_id` (`order_id`),
  CONSTRAINT `fk_sepay_transactions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sepay_transactions`
--

LOCK TABLES `sepay_transactions` WRITE;
/*!40000 ALTER TABLE `sepay_transactions` DISABLE KEYS */;
INSERT INTO `sepay_transactions` VALUES (1,999999,'MBBank','2026-10-17 23:05:00','0931883988',NULL,'in',250000,1000000,NULL,'Chuyen tien don hang FS-20261017-00001','MBTEST123456','Chuyen tien don hang FS-20261017-00001 test',11,'matched','2026-10-17 23:03:39.745','2026-10-17 23:03:39.745'),(2,888888,'MBBank','2026-10-17 23:30:00','0931883988',NULL,'in',19500000,20000000,NULL,'Thanh toan don hang FS-20261017-00004','MBTEST00004','Thanh toan don hang FS-20261017-00004',14,'matched','2026-10-17 23:29:48.045','2026-10-17 23:29:48.045'),(3,1808601720876227395,'MBBank','2026-10-18 00:23:00','0931883988',NULL,'in',5000,0,NULL,'NGUYEN TRONG BANG chuyen tien','FT26292864122060','NGUYEN TRONG BANG chuyen tien',NULL,'unmatched','2026-10-18 00:24:15.983','2026-10-18 00:24:15.983'),(4,7218992673444700196,'MBBank','2026-10-18 00:24:00','0931883988',NULL,'in',5000,0,NULL,'FS2026101800001','FT26292102063209','FS2026101800001',18,'matched','2026-10-18 00:24:39.814','2026-10-18 00:24:39.814'),(5,4412250981887679149,'MBBank','2026-10-18 01:15:00','0931883988',NULL,'in',2,0,NULL,'','0931883988-20261017','',NULL,'unmatched','2026-10-19 14:58:43.913','2026-10-19 14:58:43.913'),(6,4245621944447948368,'MBBank','2026-10-19 14:59:00','0931883988',NULL,'in',5000,0,NULL,'FS2026101900001','FT26292628753380','FS2026101900001',20,'matched','2026-10-19 14:59:13.470','2026-10-19 14:59:13.470'),(7,3849890266071281972,'MBBank','2026-10-21 01:35:00','0931883988',NULL,'in',402000,0,NULL,'152713183861-NGUYEN TRONG BANG chuyen tien qua MoMo-CHUYEN TIEN-OQCH000Mzjg1-MOMO152713183861MOMO','FT26294605779675','152713183861-NGUYEN TRONG BANG chuyen tien qua MoMo-CHUYEN TIEN-OQCH000Mzjg1-MOMO152713183861MOMO',NULL,'unmatched','2026-10-21 12:15:18.171','2026-10-21 12:15:18.171'),(8,1162841076349866714,'MBBank','2026-10-19 19:09:00','0931883988',NULL,'in',21000,0,NULL,'Q0001vetao  APPMI8704375 1  O5CH7KRL7KBM Thanh toan QR','FT26292078022652','Q0001vetao  APPMI8704375 1  O5CH7KRL7KBM Thanh toan QR',NULL,'unmatched','2026-10-21 12:15:18.180','2026-10-21 12:15:18.180'),(9,4532444155778879915,'MBBank','2026-10-19 17:28:00','0931883988',NULL,'in',25000,0,NULL,'Q0001vetao  APPMI8704375 1  Thanh toan QR','FT26292412076715','Q0001vetao  APPMI8704375 1  Thanh toan QR',NULL,'unmatched','2026-10-21 12:15:18.185','2026-10-21 12:15:18.185'),(10,8151246159994791985,'MBBank','2026-10-19 16:55:00','0931883988',NULL,'in',10002,0,NULL,'Q0001vetao  APPMI8704375 1  O5CH7KRKV4O4 Thanh toan QR','FT26292291892720','Q0001vetao  APPMI8704375 1  O5CH7KRKV4O4 Thanh toan QR',NULL,'unmatched','2026-10-21 12:15:18.192','2026-10-21 12:15:18.192'),(11,5545245044197406610,'MBBank','2026-10-19 15:01:00','0931883988',NULL,'in',17000,0,NULL,'Q0001vetao  APPMI8704375 1  Thanh toan QR- Ma GD ACSP/ 2k397352','FT26292495386028','Q0001vetao  APPMI8704375 1  Thanh toan QR- Ma GD ACSP/ 2k397352',NULL,'unmatched','2026-10-21 12:15:18.198','2026-10-21 12:15:18.198'),(12,7252074543255208063,'MBBank','2026-10-21 12:16:00','0931883988',NULL,'in',5000,0,NULL,'FS2026102100001','FT26294131003737','FS2026102100001',21,'matched','2026-10-21 12:16:18.787','2026-10-21 12:16:18.787'),(13,99988801,'MBBank','2026-10-23 11:00:00','0931883988',NULL,'in',9000,10000000,NULL,'Thanh toan don hang FS-20261023-00002','MBTEST123456','FS-20261023-00002 chuyen tien noi that',27,'matched','2026-10-23 10:58:08.643','2026-10-23 10:58:08.643'),(14,7044808983202751322,'MBBank','2026-10-23 10:34:00','0931883988',NULL,'in',5000,0,NULL,'FS2026102300002','FT26296904170541','FS2026102300002',27,'matched','2026-10-23 11:30:15.065','2026-10-23 11:30:15.065'),(15,8471253963253602306,'MBBank','2026-10-23 09:10:00','0931883988',NULL,'in',60000,0,NULL,'Q0001vetao  APPMI8704375 1  Thanh toan QR','FT26296839068904','Q0001vetao  APPMI8704375 1  Thanh toan QR',NULL,'unmatched','2026-10-23 11:30:15.068','2026-10-23 11:30:15.068'),(16,8326573744482254967,'MBBank','2026-10-23 13:41:00','0931883988',NULL,'in',5000,0,NULL,'CINE MVQTHDZRQU','FT26296500605341','CINE MVQTHDZRQU',NULL,'unmatched','2026-10-23 13:54:29.587','2026-10-23 13:54:29.587'),(17,960730378586829652,'MBBank','2026-10-23 12:03:00','0931883988',NULL,'in',35000,0,NULL,'Q0001vetao  APPMI8704375 1  Thanh toan QR FT26296509549258 k2AMZ8TP/769897','FT26296201608082','Q0001vetao  APPMI8704375 1  Thanh toan QR FT26296509549258 k2AMZ8TP/769897',NULL,'unmatched','2026-10-23 13:54:29.590','2026-10-23 13:54:29.590'),(18,0,'SePay','2026-10-28 09:35:44','0000000000',NULL,'in',10000,10000,'SEPAYTEST','SEPAY TEST WEBHOOK','TEST1793154944','SePay test webhook delivery',NULL,'unmatched','2026-10-28 09:35:45.874','2026-10-28 09:35:45.874'),(19,8052577338549007875,'MBBank','2026-10-27 13:00:00','0931883988',NULL,'in',45000,0,NULL,'Q0001vetao  APPMI8704375 1  Thanh toan QR','FT26300490534078','Q0001vetao  APPMI8704375 1  Thanh toan QR',NULL,'unmatched','2026-10-28 09:37:32.072','2026-10-28 09:37:32.072'),(20,3698597495502341015,'MBBank','2026-10-26 17:39:00','0931883988',NULL,'in',5000,0,NULL,'CINE MV7YD82LNH','FT26299618299879','CINE MV7YD82LNH',NULL,'unmatched','2026-10-28 09:37:32.133','2026-10-28 09:37:32.133'),(21,5801890131722316794,'MBBank','2026-10-26 17:32:00','0931883988',NULL,'in',5000,0,NULL,'CINE MVAXYNAH9Z','FT26299090566933','CINE MVAXYNAH9Z',NULL,'unmatched','2026-10-28 09:37:32.166','2026-10-28 09:37:32.166'),(22,3728608216318621530,'MBBank','2026-10-24 16:24:00','0931883988',NULL,'in',5000,0,NULL,'CINE MVVQ2HACBE','FT26297886909477','CINE MVVQ2HACBE',NULL,'unmatched','2026-10-28 09:37:32.190','2026-10-28 09:37:32.190'),(23,5968599243395053567,'MBBank','2026-10-24 16:12:00','0931883988',NULL,'in',5000,0,NULL,'CINE MV6K25PBGN','FT26297779360349','CINE MV6K25PBGN',NULL,'unmatched','2026-10-28 09:37:32.216','2026-10-28 09:37:32.216'),(24,1576202611732324605,'MBBank','2026-10-24 15:47:00','0931883988',NULL,'in',5000,0,NULL,'CINE MM956832','FT26297235361823','CINE MM956832',NULL,'unmatched','2026-10-28 09:37:32.233','2026-10-28 09:37:32.233'),(25,2286407437966796177,'MBBank','2026-10-24 15:41:00','0931883988',NULL,'in',5000,0,NULL,'CINE MVWMQFVCGS','FT26297985921552','CINE MVWMQFVCGS',NULL,'unmatched','2026-10-28 09:37:32.248','2026-10-28 09:37:32.248'),(26,1458474339315074851,'MBBank','2026-10-24 15:38:00','0931883988',NULL,'in',5000,0,NULL,'CINE MVKQMUGSY4','FT26297845606344','CINE MVKQMUGSY4',NULL,'unmatched','2026-10-28 09:37:32.259','2026-10-28 09:37:32.259'),(27,8149860047659553713,'MBBank','2026-10-24 15:30:00','0931883988',NULL,'in',90000,0,NULL,'CINE MVXUUH86SP','FT26297300390111','CINE MVXUUH86SP',NULL,'unmatched','2026-10-28 09:37:32.270','2026-10-28 09:37:32.270'),(28,8042935880952826902,'MBBank','2026-10-24 13:35:00','0931883988',NULL,'in',500000,0,NULL,'Q0001vetao  APPMI8704375 1  153274345303 Thanh toan QR CHUYEN TIEN OQCH000NEdUp MOMO153274345303MOMO','FT26297683326805','Q0001vetao  APPMI8704375 1  153274345303 Thanh toan QR CHUYEN TIEN OQCH000NEdUp MOMO153274345303MOMO',NULL,'unmatched','2026-10-28 09:37:32.281','2026-10-28 09:37:32.281'),(29,5759208544842600776,'MBBank','2026-10-24 10:08:00','0931883988',NULL,'in',5000,0,NULL,'CINE MM503424','FT26297209129414','CINE MM503424',NULL,'unmatched','2026-10-28 09:37:32.295','2026-10-28 09:37:32.295'),(30,1575748229375002774,'MBBank','2026-10-24 09:55:00','0931883988',NULL,'in',5000,0,NULL,'CINE MVC9SET6MQ','FT26297927903072','CINE MVC9SET6MQ',NULL,'unmatched','2026-10-28 09:37:32.305','2026-10-28 09:37:32.305'),(31,3850359942009191034,'MBBank','2026-10-23 13:54:00','0931883988',NULL,'in',5000,0,NULL,'CINE MM890573','FT26296066284421','CINE MM890573',NULL,'unmatched','2026-10-28 09:37:32.316','2026-10-28 09:37:32.316'),(32,93854235,'MBBank','2026-10-28 09:37:00','0931883988',NULL,'in',5000,0,NULL,'FS2026102800001','FT26301323017286','BankAPINotify FS2026102800001',28,'matched','2026-10-28 09:37:57.874','2026-10-28 09:37:57.874'),(33,5701878976867476212,'MBBank','2026-10-28 09:37:00','0931883988',NULL,'in',5000,0,NULL,'FS2026102800001','FT26301323017286','FS2026102800001',28,'matched','2026-10-28 10:13:56.471','2026-10-28 10:13:56.471'),(34,93863055,'MBBank','2026-10-28 10:14:00','0931883988',NULL,'in',5000,0,NULL,'FS2026102800002','FT26301492525064','BankAPINotify FS2026102800002',29,'matched','2026-10-28 10:14:11.266','2026-10-28 10:14:11.266'),(35,5057671712122531358,'MBBank','2026-10-28 10:14:00','0931883988',NULL,'in',5000,0,NULL,'FS2026102800002','FT26301492525064','FS2026102800002',29,'matched','2026-10-28 10:31:09.564','2026-10-28 10:31:09.564'),(36,93867403,'MBBank','2026-10-28 10:32:00','0931883988',NULL,'in',5000,0,NULL,'FS2026102800003','FT26301079402046','BankAPINotify FS2026102800003',30,'matched','2026-10-28 10:32:20.716','2026-10-28 10:32:20.716'),(37,1413445458073784765,'MBBank','2026-10-28 10:32:00','0931883988',NULL,'in',5000,0,NULL,'FS2026102800003','FT26301079402046','FS2026102800003',30,'matched','2026-10-28 10:32:21.284','2026-10-28 10:32:21.284');
/*!40000 ALTER TABLE `sepay_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã cài đặt',
  `key` longtext DEFAULT NULL,
  `value` longtext DEFAULT NULL,
  `group_name` varchar(50) NOT NULL DEFAULT 'general' COMMENT 'Nhóm cài đặt (general = chung, shipping = vận chuyển)',
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_settings_key` (`key`) USING HASH
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cài đặt cửa hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'shop_name','Nội Thất Góc Nhà Đẹp','general','2026-10-08 10:42:39.000'),(2,'hotline','0931.883.988','general','2026-10-08 10:42:39.000'),(3,'email','contact@gocnhadep.vn','general','2026-10-08 10:42:39.000'),(4,'address','295 Tây Thạnh, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh','general','2026-10-08 10:42:39.000'),(5,'default_shipping_fee','50000','shipping','2026-10-08 10:42:39.000'),(6,'free_shipping_threshold','5000000','shipping','2026-10-08 10:42:39.000'),(7,'bank_name','MBBank','payment','2026-10-17 21:52:37.000'),(8,'bank_account','0931883988','payment','2026-10-17 21:52:37.000'),(9,'bank_owner','NGUYEN THANH NGU','payment','2026-10-17 21:52:37.000');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Mã tài khoản',
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'customer',
  `status` varchar(50) DEFAULT 'active',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `google_id` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_deleted` (`deleted_at`),
  KEY `idx_users_deleted_at` (`deleted_at`),
  KEY `idx_users_google_id` (`google_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tài khoản người dùng (khách hàng và admin)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Quản trị viên','admin@noithat.com',NULL,'$2a$10$3xGMnzT5JAgnX6etIB9zfuWea/3RQfs73FqVzP4GV4QnZfiEgiI46','admin','active','2026-10-08 11:27:42.000','2026-10-09 12:01:29.227',NULL,NULL,NULL),(2,'Nguyen Van A','khach1@gmail.com',NULL,'$2a$10$A1T9FFOpBrmK0hX1L.wsZ.ixzbFHcF4vc/5NVvUmIo/sZcronHgGm','customer','active','2026-10-08 11:34:42.000','2026-10-08 11:34:42.000',NULL,NULL,NULL),(3,'Khach Hang Test 33917','customer33917@gmail.com','0912345678','$2a$10$xxnRAneUZA1XYyf8gzs2vuw0rQqf6kMsN4JoMqYfspopvree1gNpS','customer','active','2026-10-09 12:09:15.306','2026-10-09 12:09:15.306',NULL,NULL,NULL),(4,'Khach Hang Test 86992','customer86992@gmail.com','0912345678','$2a$10$u.AfRA13t6xE1JXC1stEPeghZDkFBMriKRBCCiAbLHKFY0VT5QnhK','customer','active','2026-10-09 12:16:08.434','2026-10-09 12:16:08.434',NULL,NULL,NULL),(5,'Khach Hang Test 45382','customer45382@gmail.com','0912345678','$2a$10$4.jZWwBXvsGALsuZGlzcOO/BsNRtMB2vM0cOgn.hb/ZoESV7DGdbm','customer','active','2026-10-09 12:18:24.454','2026-10-09 12:18:24.454',NULL,NULL,NULL),(6,'Khach Hang Test 82673','customer82673@gmail.com','0912345678','$2a$10$yDFWg9xkMs3dwgGhIhZvJeUIl/MbZXFVx.VxoxAO4S5girti0PMfq','customer','active','2026-10-09 12:27:44.881','2026-10-09 12:27:44.881',NULL,NULL,NULL),(7,'Nguyen Van A','test_user_01@gmail.com',NULL,'$2a$10$e6xasg.9J8hyXkrXm6ahceXswgouKN0.dxKQ.AmYol0clGqLOTUeO','customer','active','2026-10-09 12:31:57.078','2026-10-09 12:31:57.078',NULL,NULL,NULL),(9,'Khach Hang Test 90912','customer90912@gmail.com','0912345678','$2a$10$3nnqCSD9OTsObDOYuiajKujivoDkvfmjn3rL7YCpl/TboApixYbQG','customer','active','2026-10-17 21:53:27.001','2026-10-17 21:53:27.001',NULL,NULL,NULL),(10,'Ha Trieu Chinh','hatrieuchinh05@gmail.com','0933445566','$2a$10$2iQAjrMvqbwsufJB6Aam6.NlNSHHJXPQ2GaxFoaq8ymIPiSVsTrKi','customer','active','2026-10-22 11:49:17.171','2026-10-22 11:49:17.171',NULL,NULL,NULL),(11,'Hà Triệu Chinh','chinhhadl@gmail.com','0888213445','$2a$10$SACMFTiZ1.53YBLHaJr7ieDaPXdPfE3uFF3DaVmEtKjNaFtmNgeJq','customer','active','2026-10-22 12:30:15.365','2026-10-22 12:30:15.365',NULL,NULL,NULL),(12,'Nguyễn Thành Ngữ','nguyenthanhngu05@gmail.com',NULL,'$2a$10$YZCeWAblATI.qba0IW7OR.DYvTgPjf8CgE4iWUol00NXmrhHPLhXS','customer','active','2026-10-22 23:07:23.382','2026-10-23 09:00:40.523',NULL,NULL,NULL),(13,'Khach Hang Test 25564','customer25564@gmail.com','0912345678','$2a$10$F6CKOj6sLTV1vOCHmM9mnuXPi9Ga2mS891dDn7tCA/fXs8bbBbQ.e','customer','active','2026-10-22 23:27:55.220','2026-10-22 23:27:55.220',NULL,NULL,NULL),(14,'Khach Hang Test 69601','customer69601@gmail.com','0912345678','$2a$10$UEg/8jcScuaTlIjLBK5sTelV1zKqJlPa5K70ob.rhZl7cTxKpJwBG','customer','active','2026-10-22 23:28:10.276','2026-10-22 23:28:10.276',NULL,NULL,NULL),(15,'Khach Hang Test 56983','customer56983@gmail.com','0912345678','$2a$10$xkWle9m8HxExFcrJ/dhmnOy2ml.Z9TilMSx6EPUuqHjG022S9bowS','customer','active','2026-10-23 00:20:41.013','2026-10-23 00:20:41.013',NULL,NULL,NULL),(16,'Khach Hang Test 99852','customer99852@gmail.com','0912345678','$2a$10$NHAcStHg4gdUBuQSdFAoHuEM39aRJ62IHdFSoXaSW6ByfYP/6ewxq','customer','active','2026-10-23 00:39:32.860','2026-10-23 00:39:32.860',NULL,NULL,NULL),(18,'Bang Nguyen','nbang10072005@gmail.com',NULL,'$2a$10$ID1eyGmRk/dP237Zi8hy4OhTUV0aFwMnAjPpVrmZcjeX6FBXxW5jG','customer','active','2026-10-28 10:29:39.636','2026-10-28 10:29:39.636',NULL,'105613427633948606941',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist_items`
--

DROP TABLE IF EXISTS `wishlist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wishlist_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `product_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_product` (`user_id`,`product_id`),
  KEY `fk_wishlist_items_product` (`product_id`),
  CONSTRAINT `fk_wishlist_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist_items`
--

LOCK TABLES `wishlist_items` WRITE;
/*!40000 ALTER TABLE `wishlist_items` DISABLE KEYS */;
INSERT INTO `wishlist_items` VALUES (1,3,7,'2026-10-09 12:09:16.135'),(2,4,7,'2026-10-09 12:16:08.697'),(3,5,7,'2026-10-09 12:18:24.657'),(4,6,7,'2026-10-09 12:27:45.171'),(5,9,31,'2026-10-17 21:53:27.093'),(6,13,32,'2026-10-22 23:27:55.449'),(7,14,32,'2026-10-22 23:28:10.360'),(8,15,32,'2026-10-23 00:20:41.095'),(10,16,32,'2026-10-23 00:39:32.950'),(11,12,30,'2026-10-23 00:48:50.329'),(12,12,31,'2026-10-23 09:41:19.795'),(13,12,24,'2026-10-23 09:50:04.941');
/*!40000 ALTER TABLE `wishlist_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wishlists` (
  `user_id` bigint(20) unsigned NOT NULL COMMENT 'Tài khoản yêu thích',
  `product_id` bigint(20) unsigned NOT NULL COMMENT 'Sản phẩm được yêu thích',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Ngày thêm vào yêu thích',
  PRIMARY KEY (`user_id`,`product_id`),
  KEY `fk_wl_prod` (`product_id`),
  CONSTRAINT `fk_wl_prod` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wl_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sản phẩm yêu thích';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlists` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-30 13:15:24
