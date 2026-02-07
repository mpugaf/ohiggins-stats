-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 21-01-2026 a las 05:21:36
-- Versión del servidor: 10.6.22-MariaDB-0ubuntu0.22.04.1
-- Versión de PHP: 8.1.2-1ubuntu2.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `ufc_analytics`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `app_config`
--

CREATE TABLE `app_config` (
  `config_id` int(11) NOT NULL,
  `config_key` varchar(50) NOT NULL,
  `config_value` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `app_config`
--

INSERT INTO `app_config` (`config_id`, `config_key`, `config_value`, `description`, `updated_at`) VALUES
(1, 'betting_enabled', 'false', 'Controla si las apuestas están habilitadas', '2026-01-21 03:54:40'),
(2, 'current_event_id', '2', 'ID del evento actual para apuestas', '2026-01-19 04:13:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `betting_odds`
--

CREATE TABLE `betting_odds` (
  `odds_id` int(11) NOT NULL,
  `fight_id` int(11) NOT NULL,
  `fighter_id` int(11) DEFAULT NULL,
  `outcome_type` enum('fighter','draw') DEFAULT 'fighter',
  `decimal_odds` decimal(5,2) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `betting_odds`
--

INSERT INTO `betting_odds` (`odds_id`, `fight_id`, `fighter_id`, `outcome_type`, `decimal_odds`, `updated_at`) VALUES
(1, 1, 2, 'fighter', '2.90', '2026-01-14 05:33:44'),
(2, 1, 3, 'fighter', '1.42', '2026-01-14 05:33:44'),
(3, 2, 6, 'fighter', '1.53', '2026-01-14 18:50:45'),
(4, 2, 7, 'fighter', '2.63', '2026-01-14 18:50:45'),
(5, 3, 12, 'fighter', '1.48', '2026-01-14 19:38:37'),
(6, 3, 13, 'fighter', '2.75', '2026-01-14 19:38:37'),
(7, 4, 14, 'fighter', '1.91', '2026-01-14 19:40:02'),
(8, 4, 15, 'fighter', '1.91', '2026-01-14 19:40:02'),
(9, 5, 24, 'fighter', '1.36', '2026-01-14 19:40:53'),
(10, 5, 25, 'fighter', '3.25', '2026-01-14 19:40:53'),
(11, 6, 26, 'fighter', '1.91', '2026-01-14 19:42:26'),
(12, 6, 27, 'fighter', '1.91', '2026-01-14 19:42:26'),
(13, 7, 28, 'fighter', '3.00', '2026-01-14 19:43:03'),
(14, 7, 29, 'fighter', '1.40', '2026-01-14 19:43:03'),
(15, 8, 30, 'fighter', '1.91', '2026-01-14 19:43:38'),
(16, 8, 31, 'fighter', '1.91', '2026-01-14 19:43:38'),
(17, 9, 32, 'fighter', '1.40', '2026-01-14 19:44:33'),
(18, 9, 33, 'fighter', '3.00', '2026-01-14 19:44:33'),
(19, 10, 34, 'fighter', '1.22', '2026-01-14 19:45:02'),
(20, 10, 35, 'fighter', '4.50', '2026-01-14 19:45:02'),
(39, 2, NULL, 'draw', '10.00', '2026-01-15 13:01:09'),
(40, 3, NULL, 'draw', '10.00', '2026-01-15 13:01:09'),
(41, 4, NULL, 'draw', '10.00', '2026-01-15 13:01:09'),
(42, 5, NULL, 'draw', '10.00', '2026-01-15 13:01:09'),
(43, 6, NULL, 'draw', '10.00', '2026-01-15 13:01:09'),
(44, 7, NULL, 'draw', '10.00', '2026-01-15 13:01:09'),
(45, 8, NULL, 'draw', '10.00', '2026-01-15 13:01:09'),
(46, 1, NULL, 'draw', '10.00', '2026-01-15 13:01:09'),
(47, 9, NULL, 'draw', '10.00', '2026-01-15 13:01:09'),
(48, 10, NULL, 'draw', '10.00', '2026-01-15 13:01:09');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bridge_fight_bonuses`
--

CREATE TABLE `bridge_fight_bonuses` (
  `fight_bonus_id` int(11) NOT NULL,
  `fight_id` int(11) NOT NULL,
  `fighter_id` int(11) NOT NULL,
  `bonus_id` int(11) NOT NULL,
  `awarded_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_bonuses`
--

CREATE TABLE `dim_bonuses` (
  `bonus_id` int(11) NOT NULL,
  `bonus_type_id` int(11) NOT NULL,
  `bonus_amount` decimal(10,2) DEFAULT NULL,
  `event_id` int(11) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_bonus_types`
--

CREATE TABLE `dim_bonus_types` (
  `bonus_type_id` int(11) NOT NULL,
  `bonus_type_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_bonus_types`
--

INSERT INTO `dim_bonus_types` (`bonus_type_id`, `bonus_type_name`, `description`) VALUES
(1, 'Performance of the Night', 'Outstanding individual performance bonus'),
(2, 'Fight of the Night', 'Most exciting fight bonus (shared by both fighters)'),
(3, 'Knockout of the Night', 'Best knockout bonus (legacy bonus type)'),
(4, 'Submission of the Night', 'Best submission bonus (legacy bonus type)');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_countries`
--

CREATE TABLE `dim_countries` (
  `country_id` int(11) NOT NULL,
  `country_name` varchar(100) NOT NULL,
  `country_code` varchar(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_countries`
--

INSERT INTO `dim_countries` (`country_id`, `country_name`, `country_code`) VALUES
(1, 'United States', 'USA'),
(2, 'Brazil', 'BRA'),
(3, 'Russia', 'RUS'),
(4, 'Mexico', 'MEX'),
(5, 'Canada', 'CAN'),
(6, 'United Kingdom', 'GBR'),
(7, 'Ireland', 'IRL'),
(8, 'Australia', 'AUS'),
(9, 'Poland', 'POL'),
(10, 'Netherlands', 'NLD'),
(11, 'Sweden', 'SWE'),
(12, 'France', 'FRA'),
(13, 'Germany', 'DEU'),
(14, 'China', 'CHN'),
(15, 'Japan', 'JPN'),
(16, 'South Korea', 'KOR'),
(17, 'New Zealand', 'NZL'),
(18, 'Chile', 'CHL'),
(19, 'Argentina', 'ARG'),
(20, 'Venezuela', 'VEN'),
(21, 'Cuba', 'CUB'),
(22, 'Spain', 'ESP'),
(23, 'Italy', 'ITA'),
(24, 'Portugal', 'PRT'),
(25, 'Israel', 'ISR'),
(26, 'Nigeria', 'NGA'),
(27, 'Cameroon', 'CMR'),
(28, 'Kazakhstan', 'KAZ'),
(29, 'Thailand', 'THA'),
(30, 'Philippines', 'PHL'),
(32, 'Azerbaiyán', 'AZR'),
(34, 'Escocia', 'SCO'),
(35, 'Uzbekistán', 'UZB'),
(36, 'Myanmar', 'MMR'),
(37, 'Georgia', 'GEO'),
(39, 'Ecuador', 'ECU'),
(40, 'Lithuania', 'LIT'),
(43, 'República Dominicana', 'DOM');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_events`
--

CREATE TABLE `dim_events` (
  `event_id` int(11) NOT NULL,
  `event_name` varchar(200) NOT NULL,
  `event_date` date NOT NULL,
  `event_type_id` int(11) NOT NULL,
  `venue` varchar(200) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country_id` int(11) DEFAULT NULL,
  `attendance` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_events`
--

INSERT INTO `dim_events` (`event_id`, `event_name`, `event_date`, `event_type_id`, `venue`, `city`, `state`, `country_id`, `attendance`, `created_at`) VALUES
(1, 'UFC 324', '2026-01-25', 1, 'T-Mobile Arena', 'Las Vegas', 'Nevada', 1, NULL, '2026-01-14 05:27:13'),
(2, 'UFC 323', '2026-01-23', 1, 'T-Mobile Arena', 'Las Vegas', 'Nevada', 1, NULL, '2026-01-14 18:23:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_event_types`
--

CREATE TABLE `dim_event_types` (
  `event_type_id` int(11) NOT NULL,
  `event_type_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_event_types`
--

INSERT INTO `dim_event_types` (`event_type_id`, `event_type_name`, `description`) VALUES
(1, 'PPV', 'Pay-Per-View numbered events'),
(2, 'Fight Night', 'UFC Fight Night events'),
(3, 'TUF Finale', 'The Ultimate Fighter season finales'),
(4, 'Special', 'Special events and international cards');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_fighters`
--

CREATE TABLE `dim_fighters` (
  `fighter_id` int(11) NOT NULL,
  `fighter_name` varchar(100) NOT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `country_id` int(11) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `reach_cm` decimal(5,2) DEFAULT NULL,
  `stance_id` int(11) DEFAULT NULL,
  `total_wins` int(11) DEFAULT 0,
  `total_losses` int(11) DEFAULT 0,
  `total_draws` int(11) DEFAULT 0,
  `total_nc` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_fighters`
--

INSERT INTO `dim_fighters` (`fighter_id`, `fighter_name`, `nickname`, `image_path`, `country_id`, `date_of_birth`, `height_cm`, `reach_cm`, `stance_id`, `total_wins`, `total_losses`, `total_draws`, `total_nc`, `created_at`, `updated_at`) VALUES
(1, 'Alex Pereira', 'Poatan', '1.jpg', 2, '1987-07-07', '1.93', '2.03', 1, 13, 3, 0, 0, '2026-01-14 05:26:01', '2026-01-16 16:33:06'),
(2, 'Justin Gaethje', 'The Highlight', 'justingaethje.jpg', 1, '1988-11-14', '1.80', '1.78', 1, 26, 5, 0, 0, '2026-01-14 05:28:57', '2026-01-21 03:08:30'),
(3, 'Paddy Pimblett', 'The Baddy', 'paddypimblett.jpg', 6, '1995-01-03', '1.78', '1.85', 1, 23, 3, 0, 0, '2026-01-14 05:30:46', '2026-01-21 03:08:45'),
(6, 'Nazim Sadykhov', 'Black Wolf', 'nazimsadykhov.jpg', 32, '1994-05-16', '1.77', '1.78', 1, 11, 2, 1, 0, '2026-01-14 18:48:44', '2026-01-21 01:49:19'),
(7, 'Farès Ziam', 'Smile Killer', 'faresziam.png', 12, '1997-03-21', '1.85', '1.91', 1, 18, 4, 0, 0, '2026-01-14 18:48:44', '2026-01-21 01:52:35'),
(12, 'Maycee Barber', 'The Future', 'mayceebarber.jpg', 6, '1998-05-18', '1.65', '1.65', 3, 14, 2, 0, 0, '2026-01-14 19:00:27', '2026-01-21 02:07:51'),
(13, 'Karine Silva', 'Killer', 'karinesilva.jpg', 2, '1993-12-02', '1.65', '1.70', 1, 19, 5, 0, 0, '2026-01-14 19:00:27', '2026-01-21 02:23:19'),
(14, 'Terrance McKinney', 'T. Wrecks', 'terrancemckinney.jpg', 1, '1994-09-15', '1.78', '1.87', 1, 17, 7, 0, 0, '2026-01-14 19:00:27', '2026-01-21 02:25:29'),
(15, 'Chris Duncan', 'The Problem', 'chrisduncan.jpg', 34, '1993-05-10', '1.78', '1.82', 1, 14, 2, 0, 0, '2026-01-14 19:00:27', '2026-01-21 02:27:11'),
(24, 'Grant Dawson', 'KGD', 'grantdawson.jpg', 1, '1994-02-20', '1.78', '1.83', 1, 23, 2, 0, 0, '2026-01-14 19:19:50', '2026-01-21 02:28:29'),
(25, 'Manuel Torres', 'El Loco', 'manueltorres.jpg', 4, '1997-03-21', '1.78', '1.87', 1, 16, 3, 0, 0, '2026-01-14 19:19:50', '2026-01-21 02:30:07'),
(26, 'Jan Błachowicz', '', 'janblachowicz.jpg', 9, '1983-02-24', '1.88', '1.98', 1, 29, 11, 1, 0, '2026-01-14 19:19:50', '2026-01-21 02:33:53'),
(27, 'Bogdan Guskov', '', 'bogdanguskov.jpg', 35, '1992-09-12', '1.90', '1.93', 1, 18, 3, 0, 0, '2026-01-14 19:19:50', '2026-01-21 02:36:04'),
(28, 'Henry Cejudo', 'Triple C', 'henrycejudo.jpg', 1, '1987-02-09', '1.63', '1.71', 1, 16, 5, 0, 0, '2026-01-14 19:28:12', '2026-01-21 02:38:12'),
(29, 'Payton Talbott', NULL, 'paytontalbott.jpg', 1, '1998-09-09', '1.78', '1.78', 1, 1, 1, 0, 0, '2026-01-14 19:28:12', '2026-01-21 02:40:12'),
(30, 'Brandon Moreno', 'The Assassin Baby', 'brandonmoreno.jpg', 4, '1993-12-07', '1.70', '1.78', 1, 23, 8, 0, 0, '2026-01-14 19:28:12', '2026-01-21 02:43:22'),
(31, 'Tatsuro Taira', 'The Best', 'tatsurotaira.jpg', 15, '2000-01-27', '1.70', '1.78', 1, 18, 1, 0, 0, '2026-01-14 19:28:12', '2026-01-21 02:43:38'),
(32, 'Alexandre Pantoja', 'The Cannibal', 'alexandrepantoja.jpg', 2, '1990-04-16', '1.66', '1.73', 1, 30, 6, 0, 0, '2026-01-14 19:28:12', '2026-01-21 02:45:19'),
(33, 'Joshua Van', 'The Fearless', 'joshuavan.jpg', 36, '2001-10-10', '1.65', '1.65', 1, 16, 2, 0, 0, '2026-01-14 19:28:12', '2026-01-21 02:47:16'),
(34, 'Merab Dvalishvili', 'The Machine', 'merabdvalishvili.jpg', 37, '1991-01-10', '1.68', '1.73', 1, 21, 5, 0, 0, '2026-01-14 19:30:05', '2026-01-21 02:49:34'),
(35, 'Petr Yan', 'No Mercy', 'petryan.jpg', 3, '1993-02-11', '1.71', '1.71', 1, 20, 5, 0, 0, '2026-01-14 19:30:05', '2026-01-21 02:49:48'),
(36, 'Nikita Krylov', 'The Miner', 'nikitakrylov.jpg', 3, '1992-07-03', '1.91', '1.97', 1, 30, 11, 0, 0, '2026-01-16 16:13:45', '2026-01-21 02:52:07'),
(37, 'Modestas Bukauskas', 'The Baltic Gladiator', 'modestasbukauskas.jpg', 40, '1994-02-10', '1.91', '1.93', 1, 19, 6, 0, 0, '2026-01-16 16:14:49', '2026-01-21 02:54:07'),
(38, 'Ateba Gautier', 'The Silent Assassin', 'atebagautier.jpg', 27, '2002-04-10', '1.93', '2.06', 1, 9, 1, 0, 0, '2026-01-16 16:18:51', '2026-01-21 02:57:03'),
(39, 'Andrey Pulyaev', '', 'andreypulyaev.jpg', 3, '1997-09-10', '1.93', '1.99', 1, 10, 3, 0, 0, '2026-01-16 16:19:37', '2026-01-21 02:57:19'),
(40, 'Umar Nurmagomedov', '', 'umarnurmagomedov.jpg', 3, '1996-01-03', '1.72', '1.75', 1, 19, 1, 0, 0, '2026-01-16 16:20:58', '2026-01-21 03:09:32'),
(41, 'Deiveson Figueiredo', 'Deus da Guerra', 'deivesonfigueiredo.jpg', 2, '1987-12-18', '1.65', '1.73', 1, 25, 5, 1, 0, '2026-01-16 16:21:46', '2026-01-21 03:09:51'),
(42, 'Arnold Allen', 'Almighty', 'arnoldallen.jpg', 6, '1994-01-22', '1.73', '1.78', 1, 20, 3, 0, 0, '2026-01-16 16:23:16', '2026-01-21 03:10:03'),
(43, 'Jean Silva', 'Lord', 'jeansilva.jpg', 2, '1996-12-13', '1.70', '1.75', 1, 16, 3, 0, 0, '2026-01-16 16:23:58', '2026-01-21 03:10:20'),
(44, 'Natalia Silva', '', 'nataliasilva.jpg', 2, '1997-02-03', '1.63', '1.65', 1, 19, 5, 1, 0, '2026-01-16 16:25:26', '2026-01-21 03:10:34'),
(45, 'Rose Namajunas', 'Thug', 'rosenamajunas.jpg', 1, '1992-06-29', '1.65', '1.65', 1, 15, 7, 0, 0, '2026-01-16 16:26:08', '2026-01-21 03:10:48'),
(46, 'Waldo Cortes Acosta', 'Salsa Boy', 'waldocortes.jpg', 43, '1991-10-03', '1.93', '1.98', 1, 16, 2, 0, 0, '2026-01-16 16:26:58', '2026-01-21 03:10:59'),
(47, 'Derrick Lewis', 'The Black Beast', 'derricklewis.jpg', 1, '1995-02-07', '1.91', '2.01', 1, 29, 12, 0, 0, '2026-01-16 16:28:47', '2026-01-21 03:11:11'),
(48, 'Sean O\'Malley', 'Sugar', 'seanomalley.jpg', 1, '1994-10-24', '1.80', '1.83', 1, 18, 3, 0, 0, '2026-01-16 16:29:26', '2026-01-21 03:11:22'),
(49, 'Song Yadong', 'Kung Fu Kid', 'songyadong.jpg', 14, '1997-12-02', '1.73', '1.73', 1, 22, 8, 1, 0, '2026-01-16 16:30:12', '2026-01-21 03:11:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_fight_categories`
--

CREATE TABLE `dim_fight_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(50) NOT NULL,
  `category_code` varchar(20) NOT NULL,
  `display_order` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_fight_categories`
--

INSERT INTO `dim_fight_categories` (`category_id`, `category_name`, `category_code`, `display_order`, `description`, `created_at`) VALUES
(1, 'Preliminares', 'preliminary', 1, 'Peleas preliminares del evento', '2026-01-14 22:25:45'),
(2, 'Cartelera Estelar', 'main_card', 2, 'Peleas de la cartelera principal', '2026-01-14 22:25:45'),
(3, 'Pelea por el Título', 'title_fight', 3, 'Peleas por el campeonato', '2026-01-14 22:25:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_fight_methods`
--

CREATE TABLE `dim_fight_methods` (
  `method_id` int(11) NOT NULL,
  `method_name` varchar(100) NOT NULL,
  `method_category` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_fight_methods`
--

INSERT INTO `dim_fight_methods` (`method_id`, `method_name`, `method_category`, `description`) VALUES
(1, 'KO/TKO', 'Knockout', 'Knockout or Technical Knockout'),
(2, 'Submission', 'Submission', 'Opponent tapped out or was rendered unconscious'),
(3, 'Decision - Unanimous', 'Decision', 'All judges scored for the same fighter'),
(4, 'Decision - Split', 'Decision', 'Judges split on the winner'),
(5, 'Decision - Majority', 'Decision', 'Two judges scored for the same fighter, one scored a draw'),
(6, 'DQ', 'Disqualification', 'Fighter disqualified for rule violations'),
(7, 'No Contest', 'No Contest', 'Fight ruled no contest due to accidental foul or other circumstances'),
(8, 'Draw - Unanimous', 'Draw', 'All judges scored the fight a draw'),
(9, 'Draw - Majority', 'Draw', 'Two judges scored a draw, one scored for a fighter'),
(10, 'Draw - Split', 'Draw', 'Each judge scored differently');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_fight_results`
--

CREATE TABLE `dim_fight_results` (
  `fight_result_id` int(11) NOT NULL,
  `result_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_fight_results`
--

INSERT INTO `dim_fight_results` (`fight_result_id`, `result_name`, `description`) VALUES
(1, 'Win', 'Fighter won the bout'),
(2, 'Loss', 'Fighter lost the bout'),
(3, 'Draw', 'Fight ended in a draw'),
(4, 'No Contest', 'Fight ruled no contest'),
(5, 'DQ', 'Fighter disqualified');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_genders`
--

CREATE TABLE `dim_genders` (
  `gender_id` int(11) NOT NULL,
  `gender_name` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_genders`
--

INSERT INTO `dim_genders` (`gender_id`, `gender_name`) VALUES
(2, 'Female'),
(1, 'Male');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_rankings`
--

CREATE TABLE `dim_rankings` (
  `ranking_id` int(11) NOT NULL,
  `fighter_id` int(11) NOT NULL,
  `weight_class_id` int(11) NOT NULL,
  `rank_position` int(11) DEFAULT NULL,
  `is_champion` tinyint(1) DEFAULT 0,
  `effective_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_referees`
--

CREATE TABLE `dim_referees` (
  `referee_id` int(11) NOT NULL,
  `referee_name` varchar(100) NOT NULL,
  `country_id` int(11) DEFAULT NULL,
  `total_fights_refereed` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_stances`
--

CREATE TABLE `dim_stances` (
  `stance_id` int(11) NOT NULL,
  `stance_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_stances`
--

INSERT INTO `dim_stances` (`stance_id`, `stance_name`) VALUES
(1, 'Orthodox'),
(2, 'Southpaw'),
(3, 'Switch');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_time`
--

CREATE TABLE `dim_time` (
  `time_id` int(11) NOT NULL,
  `full_date` date NOT NULL,
  `day_of_week` varchar(10) DEFAULT NULL,
  `day_of_month` int(11) DEFAULT NULL,
  `month` int(11) DEFAULT NULL,
  `month_name` varchar(10) DEFAULT NULL,
  `quarter` int(11) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `is_weekend` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_time`
--

INSERT INTO `dim_time` (`time_id`, `full_date`, `day_of_week`, `day_of_month`, `month`, `month_name`, `quarter`, `year`, `is_weekend`) VALUES
(1, '2026-01-24', 'Saturday', 24, 1, 'January', 1, 2026, 1),
(2, '2026-02-15', 'Sunday', 15, 2, 'February', 1, 2026, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dim_weight_classes`
--

CREATE TABLE `dim_weight_classes` (
  `weight_class_id` int(11) NOT NULL,
  `class_name` varchar(50) NOT NULL,
  `gender_id` int(11) NOT NULL,
  `weight_limit_lbs` decimal(5,2) NOT NULL,
  `weight_limit_kg` decimal(5,2) NOT NULL,
  `display_order` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dim_weight_classes`
--

INSERT INTO `dim_weight_classes` (`weight_class_id`, `class_name`, `gender_id`, `weight_limit_lbs`, `weight_limit_kg`, `display_order`) VALUES
(1, 'Flyweight', 1, '125.00', '56.70', 1),
(2, 'Bantamweight', 1, '135.00', '61.20', 2),
(3, 'Featherweight', 1, '145.00', '65.80', 3),
(4, 'Lightweight', 1, '155.00', '70.30', 4),
(5, 'Welterweight', 1, '170.00', '77.10', 5),
(6, 'Middleweight', 1, '185.00', '83.90', 6),
(7, 'Light Heavyweight', 1, '205.00', '93.00', 7),
(8, 'Heavyweight', 1, '265.00', '120.20', 8),
(13, 'Strawweight', 2, '115.00', '52.20', 9);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fact_fights`
--

CREATE TABLE `fact_fights` (
  `fight_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `time_id` int(11) NOT NULL,
  `weight_class_id` int(11) NOT NULL,
  `fight_category_id` int(11) DEFAULT NULL,
  `card_position` int(11) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `referee_id` int(11) DEFAULT NULL,
  `fighter_red_id` int(11) NOT NULL,
  `fighter_blue_id` int(11) NOT NULL,
  `winner_id` int(11) DEFAULT NULL,
  `result_type_code` varchar(20) DEFAULT NULL,
  `fight_result_id` int(11) NOT NULL,
  `method_id` int(11) NOT NULL,
  `method_detail` varchar(100) DEFAULT NULL,
  `scheduled_rounds` int(11) NOT NULL,
  `final_round` int(11) NOT NULL,
  `final_time_seconds` int(11) NOT NULL,
  `total_fight_time_seconds` int(11) NOT NULL,
  `red_significant_strikes_landed` int(11) DEFAULT 0,
  `red_significant_strikes_attempted` int(11) DEFAULT 0,
  `red_total_strikes_landed` int(11) DEFAULT 0,
  `red_total_strikes_attempted` int(11) DEFAULT 0,
  `red_takedowns_landed` int(11) DEFAULT 0,
  `red_takedowns_attempted` int(11) DEFAULT 0,
  `red_submission_attempts` int(11) DEFAULT 0,
  `red_knockdowns` int(11) DEFAULT 0,
  `red_control_time_seconds` int(11) DEFAULT 0,
  `blue_significant_strikes_landed` int(11) DEFAULT 0,
  `blue_significant_strikes_attempted` int(11) DEFAULT 0,
  `blue_total_strikes_landed` int(11) DEFAULT 0,
  `blue_total_strikes_attempted` int(11) DEFAULT 0,
  `blue_takedowns_landed` int(11) DEFAULT 0,
  `blue_takedowns_attempted` int(11) DEFAULT 0,
  `blue_submission_attempts` int(11) DEFAULT 0,
  `blue_knockdowns` int(11) DEFAULT 0,
  `blue_control_time_seconds` int(11) DEFAULT 0,
  `is_title_fight` tinyint(1) DEFAULT 0,
  `is_main_event` tinyint(1) DEFAULT 0,
  `is_co_main_event` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `fact_fights`
--

INSERT INTO `fact_fights` (`fight_id`, `event_id`, `time_id`, `weight_class_id`, `fight_category_id`, `card_position`, `display_order`, `referee_id`, `fighter_red_id`, `fighter_blue_id`, `winner_id`, `result_type_code`, `fight_result_id`, `method_id`, `method_detail`, `scheduled_rounds`, `final_round`, `final_time_seconds`, `total_fight_time_seconds`, `red_significant_strikes_landed`, `red_significant_strikes_attempted`, `red_total_strikes_landed`, `red_total_strikes_attempted`, `red_takedowns_landed`, `red_takedowns_attempted`, `red_submission_attempts`, `red_knockdowns`, `red_control_time_seconds`, `blue_significant_strikes_landed`, `blue_significant_strikes_attempted`, `blue_total_strikes_landed`, `blue_total_strikes_attempted`, `blue_takedowns_landed`, `blue_takedowns_attempted`, `blue_submission_attempts`, `blue_knockdowns`, `blue_control_time_seconds`, `is_title_fight`, `is_main_event`, `is_co_main_event`, `created_at`) VALUES
(1, 1, 1, 4, 3, 5, 5, NULL, 2, 3, NULL, NULL, 1, 5, NULL, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, '2026-01-14 05:33:44'),
(2, 2, 2, 4, 1, 99, 1, NULL, 6, 7, 7, 'fighter_win', 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-14 18:50:45'),
(3, 2, 2, 13, 1, 99, 2, NULL, 12, 13, 12, 'fighter_win', 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-14 19:38:37'),
(4, 2, 2, 4, 1, 99, 3, NULL, 14, 15, 15, 'fighter_win', 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-14 19:40:02'),
(5, 2, 2, 4, 1, 99, 4, NULL, 24, 25, 25, 'fighter_win', 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-14 19:40:53'),
(6, 2, 2, 7, 2, 99, 1, NULL, 26, 27, NULL, 'draw', 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-14 19:42:26'),
(7, 2, 2, 2, 2, 99, 2, NULL, 28, 29, 29, 'fighter_win', 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-14 19:43:03'),
(8, 2, 2, 1, 2, 99, 3, NULL, 30, 31, 31, 'fighter_win', 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-14 19:43:38'),
(9, 2, 2, 1, 3, 99, 1, NULL, 32, 33, 33, 'fighter_win', 1, 5, NULL, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, '2026-01-14 19:44:32'),
(10, 2, 2, 2, 3, 99, 2, NULL, 34, 35, 35, 'fighter_win', 1, 5, NULL, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, '2026-01-14 19:45:02'),
(17, 1, 1, 7, 1, 1, 1, NULL, 36, 37, NULL, NULL, 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-16 16:36:13'),
(18, 1, 1, 6, 1, 2, 2, NULL, 38, 39, NULL, NULL, 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-16 16:36:53'),
(19, 1, 1, 2, 1, 3, 3, NULL, 40, 41, NULL, NULL, 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-16 16:37:16'),
(20, 1, 1, 3, 2, 1, 1, NULL, 42, 43, NULL, NULL, 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-16 16:38:18'),
(21, 1, 1, 13, 2, 2, 2, NULL, 44, 45, NULL, NULL, 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-16 16:38:47'),
(22, 1, 1, 8, 2, 3, 3, NULL, 46, 47, NULL, NULL, 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-16 16:39:08'),
(23, 1, 1, 2, 2, 4, 4, NULL, 48, 49, NULL, NULL, 1, 5, NULL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-16 16:39:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `invitation_tokens`
--

CREATE TABLE `invitation_tokens` (
  `token_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `email` varchar(255) DEFAULT NULL COMMENT 'Email opcional para vincular token a usuario específico',
  `created_by` int(11) NOT NULL COMMENT 'Admin que generó la invitación',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'Fecha de expiración (default 7 días)',
  `used_at` timestamp NULL DEFAULT NULL COMMENT 'Cuándo se usó el token',
  `used_by` int(11) DEFAULT NULL COMMENT 'Usuario que usó el token',
  `revoked_at` timestamp NULL DEFAULT NULL COMMENT 'Cuándo se revocó (si aplica)',
  `revoked_by` int(11) DEFAULT NULL COMMENT 'Admin que revocó el token',
  `notes` text DEFAULT NULL COMMENT 'Notas sobre la invitación'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tokens de invitación para registro de nuevos usuarios';

--
-- Volcado de datos para la tabla `invitation_tokens`
--

INSERT INTO `invitation_tokens` (`token_id`, `token`, `email`, `created_by`, `created_at`, `expires_at`, `used_at`, `used_by`, `revoked_at`, `revoked_by`, `notes`) VALUES
(1, 'a0b551765181a4f3679e5a24aec386a3b2159130af3a2480a35805b990aa2ba7', NULL, 1, '2026-01-21 03:34:46', '2026-01-28 03:34:46', NULL, NULL, '2026-01-21 03:37:03', 1, NULL),
(2, '6d06f708c20443ee1b87ee46d5f551768c7f0db0dfa9167b03b2d797aee02b75', 'marco.puga@gmail.com', 1, '2026-01-21 03:34:50', '2026-01-28 03:34:50', NULL, NULL, '2026-01-21 03:37:01', 1, NULL),
(3, 'f791586ef2181feb9ddfb6c7159fab97ede85c12a39b0232e0ae364394905125', NULL, 1, '2026-01-21 03:37:23', '2026-01-28 03:37:23', '2026-01-21 03:37:52', 10, NULL, NULL, NULL),
(4, '11c5cd699d6003a5d39e20b9208870071e470f954c9f97dd50cdcdf250807da0', NULL, 1, '2026-01-21 04:02:43', '2026-01-22 04:02:43', '2026-01-21 04:03:43', 11, NULL, NULL, NULL),
(5, '8f0fa67433247f5618f1f811cf2ba256e686da7a64ae8c329ca22bb65fcb385b', NULL, 1, '2026-01-21 04:05:01', '2026-01-28 04:05:01', '2026-01-21 04:05:29', 12, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `predictions`
--

CREATE TABLE `predictions` (
  `prediction_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `fight_id` int(11) NOT NULL,
  `predicted_winner_id` int(11) NOT NULL,
  `predicted_method_id` int(11) DEFAULT NULL,
  `predicted_round` int(11) DEFAULT NULL,
  `points_earned` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registration_tokens`
--

CREATE TABLE `registration_tokens` (
  `token_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `created_by` int(11) NOT NULL,
  `used_by` int(11) DEFAULT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `password_hash` varchar(255) NOT NULL,
  `country_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `can_bet` tinyint(1) DEFAULT 1 COMMENT 'Indica si el usuario puede realizar apuestas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`user_id`, `username`, `nickname`, `email`, `role`, `password_hash`, `country_id`, `created_at`, `can_bet`) VALUES
(1, 'admin', NULL, 'test@example.com', 'admin', '$2a$10$1yAIdXcG7W.dd80poe09Lu5ZFTwUEhe9ywtjyLeQ9uy5dSsgmQba2', 1, '2026-01-14 04:39:28', 0),
(7, 'dan', NULL, NULL, 'user', '$2a$10$XG.rE1bsf0eJI9HuVI6k7emVpGN9lbVJuHGjf9e3bogfHrt8mEz/K', NULL, '2026-01-17 20:10:36', 1),
(8, 'jack', NULL, NULL, 'user', '$2a$10$XSP1A1xt8.tTYOEiA77tn.OlaUpFcQRynFLIX8M4vexlBJPEvADa6', NULL, '2026-01-19 04:07:16', 1),
(9, 'john', NULL, NULL, 'user', '$2a$10$kSdPWwi082OEDRFYlvf2Y.8./zEAf.J5LY6o2YjxnfgIQfaLp3f7O', NULL, '2026-01-21 01:04:02', 1),
(10, 'token', NULL, NULL, 'user', '$2a$10$bqIUk7jiTgb11hn6YBA2z.TPILueVcH6WKzQQWUxL6JZ9uNL0i.6.', NULL, '2026-01-21 03:37:52', 1),
(11, 'token2', NULL, NULL, 'user', '$2a$10$jGX7GRxFnFDezRLIW/4DJeIU8VIFRjaWSsz/Tgn6HNXb82Rboa95O', NULL, '2026-01-21 04:03:43', 1),
(12, 'token3', NULL, NULL, 'user', '$2a$10$E0mHdbEEa7K47KDynh96Ve.vDMWn4UzJwhcNKhnwwOA1oFhRWltP.', NULL, '2026-01-21 04:05:29', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_bets`
--

CREATE TABLE `user_bets` (
  `bet_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `fight_id` int(11) NOT NULL,
  `event_id` int(11) DEFAULT NULL,
  `predicted_winner_id` int(11) DEFAULT NULL,
  `bet_type` enum('fighter_win','draw') DEFAULT 'fighter_win',
  `bet_amount` decimal(10,2) DEFAULT 100.00,
  `potential_return` decimal(10,2) DEFAULT NULL,
  `odds_value` decimal(5,2) DEFAULT NULL,
  `status` enum('pending','won','lost','cancelled') DEFAULT 'pending',
  `result_points` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_bets`
--

INSERT INTO `user_bets` (`bet_id`, `user_id`, `fight_id`, `event_id`, `predicted_winner_id`, `bet_type`, `bet_amount`, `potential_return`, `odds_value`, `status`, `result_points`, `created_at`) VALUES
(213, 7, 2, 2, 7, 'fighter_win', '100.00', '263.00', '2.63', 'won', 0, '2026-01-21 03:51:29'),
(214, 7, 3, 2, 12, 'fighter_win', '100.00', '148.00', '1.48', 'won', 0, '2026-01-21 03:51:29'),
(215, 7, 4, 2, 15, 'fighter_win', '100.00', '191.00', '1.91', 'won', 0, '2026-01-21 03:51:29'),
(216, 7, 5, 2, 25, 'fighter_win', '100.00', '325.00', '3.25', 'won', 0, '2026-01-21 03:51:29'),
(217, 7, 6, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'won', 0, '2026-01-21 03:51:29'),
(218, 7, 7, 2, 29, 'fighter_win', '100.00', '140.00', '1.40', 'won', 0, '2026-01-21 03:51:29'),
(219, 7, 8, 2, 31, 'fighter_win', '100.00', '191.00', '1.91', 'won', 0, '2026-01-21 03:51:29'),
(220, 7, 9, 2, 33, 'fighter_win', '100.00', '300.00', '3.00', 'won', 0, '2026-01-21 03:51:29'),
(221, 7, 10, 2, 35, 'fighter_win', '100.00', '450.00', '4.50', 'won', 0, '2026-01-21 03:51:29'),
(222, 10, 2, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'lost', 0, '2026-01-21 03:52:32'),
(223, 10, 3, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'lost', 0, '2026-01-21 03:52:32'),
(224, 10, 4, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'lost', 0, '2026-01-21 03:52:32'),
(225, 10, 5, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'lost', 0, '2026-01-21 03:52:32'),
(226, 10, 6, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'won', 0, '2026-01-21 03:52:32'),
(227, 10, 7, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'lost', 0, '2026-01-21 03:52:32'),
(228, 10, 8, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'lost', 0, '2026-01-21 03:52:32'),
(229, 10, 9, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'lost', 0, '2026-01-21 03:52:32'),
(230, 10, 10, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'lost', 0, '2026-01-21 03:52:32'),
(231, 8, 2, 2, 6, 'fighter_win', '100.00', '153.00', '1.53', 'lost', 0, '2026-01-21 03:53:12'),
(232, 8, 3, 2, 13, 'fighter_win', '100.00', '275.00', '2.75', 'lost', 0, '2026-01-21 03:53:12'),
(233, 8, 4, 2, 14, 'fighter_win', '100.00', '191.00', '1.91', 'lost', 0, '2026-01-21 03:53:12'),
(234, 8, 5, 2, 24, 'fighter_win', '100.00', '136.00', '1.36', 'lost', 0, '2026-01-21 03:53:12'),
(235, 8, 6, 2, 26, 'fighter_win', '100.00', '191.00', '1.91', 'lost', 0, '2026-01-21 03:53:12'),
(236, 8, 7, 2, 28, 'fighter_win', '100.00', '300.00', '3.00', 'lost', 0, '2026-01-21 03:53:12'),
(237, 8, 8, 2, 30, 'fighter_win', '100.00', '191.00', '1.91', 'lost', 0, '2026-01-21 03:53:12'),
(238, 8, 9, 2, 32, 'fighter_win', '100.00', '140.00', '1.40', 'lost', 0, '2026-01-21 03:53:12'),
(239, 8, 10, 2, 34, 'fighter_win', '100.00', '122.00', '1.22', 'lost', 0, '2026-01-21 03:53:12'),
(240, 9, 2, 2, 7, 'fighter_win', '100.00', '263.00', '2.63', 'won', 0, '2026-01-21 03:54:27'),
(241, 9, 3, 2, 12, 'fighter_win', '100.00', '148.00', '1.48', 'won', 0, '2026-01-21 03:54:27'),
(242, 9, 4, 2, 14, 'fighter_win', '100.00', '191.00', '1.91', 'lost', 0, '2026-01-21 03:54:27'),
(243, 9, 5, 2, 24, 'fighter_win', '100.00', '136.00', '1.36', 'lost', 0, '2026-01-21 03:54:27'),
(244, 9, 6, 2, NULL, 'draw', '100.00', '1000.00', '10.00', 'won', 0, '2026-01-21 03:54:27'),
(245, 9, 7, 2, 29, 'fighter_win', '100.00', '140.00', '1.40', 'won', 0, '2026-01-21 03:54:27'),
(246, 9, 8, 2, 31, 'fighter_win', '100.00', '191.00', '1.91', 'won', 0, '2026-01-21 03:54:27'),
(247, 9, 9, 2, 33, 'fighter_win', '100.00', '300.00', '3.00', 'won', 0, '2026-01-21 03:54:27'),
(248, 9, 10, 2, 35, 'fighter_win', '100.00', '450.00', '4.50', 'won', 0, '2026-01-21 03:54:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_points_history`
--

CREATE TABLE `user_points_history` (
  `point_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `bet_id` int(11) NOT NULL,
  `fight_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `points_earned` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks points earned by users for each bet, enabling accurate event and annual summaries';

--
-- Volcado de datos para la tabla `user_points_history`
--

INSERT INTO `user_points_history` (`point_id`, `user_id`, `bet_id`, `fight_id`, `event_id`, `points_earned`, `created_at`) VALUES
(11, 7, 213, 2, 2, '263.00', '2026-01-21 03:55:06'),
(12, 9, 240, 2, 2, '263.00', '2026-01-21 03:55:06'),
(13, 7, 214, 3, 2, '148.00', '2026-01-21 03:55:09'),
(14, 9, 241, 3, 2, '148.00', '2026-01-21 03:55:09'),
(15, 7, 215, 4, 2, '191.00', '2026-01-21 03:55:11'),
(16, 7, 216, 5, 2, '325.00', '2026-01-21 03:55:14'),
(17, 7, 217, 6, 2, '1000.00', '2026-01-21 03:55:16'),
(18, 10, 226, 6, 2, '1000.00', '2026-01-21 03:55:16'),
(19, 9, 244, 6, 2, '1000.00', '2026-01-21 03:55:16'),
(20, 7, 218, 7, 2, '140.00', '2026-01-21 03:55:19'),
(21, 9, 245, 7, 2, '140.00', '2026-01-21 03:55:19'),
(22, 7, 219, 8, 2, '191.00', '2026-01-21 03:55:21'),
(23, 9, 246, 8, 2, '191.00', '2026-01-21 03:55:21'),
(24, 7, 220, 9, 2, '300.00', '2026-01-21 03:55:24'),
(25, 9, 247, 9, 2, '300.00', '2026-01-21 03:55:24'),
(26, 7, 221, 10, 2, '450.00', '2026-01-21 03:55:26'),
(27, 9, 248, 10, 2, '450.00', '2026-01-21 03:55:26');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_fighter_stats`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_fighter_stats` (
`fighter_id` int(11)
,`fighter_name` varchar(100)
,`country_name` varchar(100)
,`country_code` varchar(3)
,`total_ufc_fights` bigint(21)
,`ufc_wins` decimal(22,0)
,`ufc_losses` decimal(22,0)
,`ufc_draws` decimal(22,0)
,`title_fights` decimal(22,0)
,`total_bonuses` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vw_fights_detailed`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vw_fights_detailed` (
`fight_id` int(11)
,`event_name` varchar(200)
,`event_date` date
,`event_type_name` varchar(50)
,`weight_class` varchar(50)
,`gender` varchar(20)
,`red_corner` varchar(100)
,`blue_corner` varchar(100)
,`winner` varchar(100)
,`method_name` varchar(100)
,`fight_result` varchar(50)
,`final_round` int(11)
,`final_time_seconds` int(11)
,`is_title_fight` tinyint(1)
,`is_main_event` tinyint(1)
,`referee_name` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_user_annual_points`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_user_annual_points` (
`user_id` int(11)
,`username` varchar(50)
,`nickname` varchar(50)
,`year` int(5)
,`annual_points` decimal(32,2)
,`annual_bets` bigint(21)
,`events_participated` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_user_event_points`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_user_event_points` (
`user_id` int(11)
,`username` varchar(50)
,`nickname` varchar(50)
,`event_id` int(11)
,`event_name` varchar(200)
,`event_date` date
,`event_points` decimal(32,2)
,`event_bets` bigint(21)
,`winning_bets` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_user_points_detail`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_user_points_detail` (
`point_id` int(11)
,`user_id` int(11)
,`username` varchar(50)
,`nickname` varchar(50)
,`bet_id` int(11)
,`fight_id` int(11)
,`event_id` int(11)
,`event_name` varchar(200)
,`event_date` date
,`red_fighter` varchar(100)
,`blue_fighter` varchar(100)
,`predicted_winner_id` int(11)
,`predicted_winner` varchar(100)
,`winner_id` int(11)
,`actual_winner` varchar(100)
,`bet_amount` decimal(10,2)
,`potential_return` decimal(10,2)
,`points_earned` decimal(10,2)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_user_total_points`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_user_total_points` (
`user_id` int(11)
,`username` varchar(50)
,`nickname` varchar(50)
,`total_points` decimal(32,2)
,`total_bets` bigint(21)
,`events_participated` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_fighter_stats`
--
DROP TABLE IF EXISTS `vw_fighter_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`mpuga`@`%` SQL SECURITY DEFINER VIEW `vw_fighter_stats`  AS SELECT `f`.`fighter_id` AS `fighter_id`, `f`.`fighter_name` AS `fighter_name`, `c`.`country_name` AS `country_name`, `c`.`country_code` AS `country_code`, count(distinct `ff`.`fight_id`) AS `total_ufc_fights`, sum(case when `ff`.`winner_id` = `f`.`fighter_id` then 1 else 0 end) AS `ufc_wins`, sum(case when `ff`.`winner_id` <> `f`.`fighter_id` and `fr`.`result_name` = 'Win' then 1 else 0 end) AS `ufc_losses`, sum(case when `fr`.`result_name` = 'Draw' then 1 else 0 end) AS `ufc_draws`, sum(case when `ff`.`is_title_fight` = 1 then 1 else 0 end) AS `title_fights`, count(distinct `bfb`.`bonus_id`) AS `total_bonuses` FROM ((((`dim_fighters` `f` left join `dim_countries` `c` on(`f`.`country_id` = `c`.`country_id`)) left join `fact_fights` `ff` on(`f`.`fighter_id` = `ff`.`fighter_red_id` or `f`.`fighter_id` = `ff`.`fighter_blue_id`)) left join `dim_fight_results` `fr` on(`ff`.`fight_result_id` = `fr`.`fight_result_id`)) left join `bridge_fight_bonuses` `bfb` on(`f`.`fighter_id` = `bfb`.`fighter_id`)) GROUP BY `f`.`fighter_id`, `f`.`fighter_name`, `c`.`country_name`, `c`.`country_code` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vw_fights_detailed`
--
DROP TABLE IF EXISTS `vw_fights_detailed`;

CREATE ALGORITHM=UNDEFINED DEFINER=`mpuga`@`%` SQL SECURITY DEFINER VIEW `vw_fights_detailed`  AS SELECT `ff`.`fight_id` AS `fight_id`, `e`.`event_name` AS `event_name`, `e`.`event_date` AS `event_date`, `et`.`event_type_name` AS `event_type_name`, `wc`.`class_name` AS `weight_class`, `g`.`gender_name` AS `gender`, `fr`.`fighter_name` AS `red_corner`, `fb`.`fighter_name` AS `blue_corner`, `w`.`fighter_name` AS `winner`, `fm`.`method_name` AS `method_name`, `fres`.`result_name` AS `fight_result`, `ff`.`final_round` AS `final_round`, `ff`.`final_time_seconds` AS `final_time_seconds`, `ff`.`is_title_fight` AS `is_title_fight`, `ff`.`is_main_event` AS `is_main_event`, `ref`.`referee_name` AS `referee_name` FROM ((((((((((`fact_fights` `ff` join `dim_events` `e` on(`ff`.`event_id` = `e`.`event_id`)) join `dim_event_types` `et` on(`e`.`event_type_id` = `et`.`event_type_id`)) join `dim_weight_classes` `wc` on(`ff`.`weight_class_id` = `wc`.`weight_class_id`)) join `dim_genders` `g` on(`wc`.`gender_id` = `g`.`gender_id`)) join `dim_fighters` `fr` on(`ff`.`fighter_red_id` = `fr`.`fighter_id`)) join `dim_fighters` `fb` on(`ff`.`fighter_blue_id` = `fb`.`fighter_id`)) join `dim_fight_methods` `fm` on(`ff`.`method_id` = `fm`.`method_id`)) join `dim_fight_results` `fres` on(`ff`.`fight_result_id` = `fres`.`fight_result_id`)) left join `dim_fighters` `w` on(`ff`.`winner_id` = `w`.`fighter_id`)) left join `dim_referees` `ref` on(`ff`.`referee_id` = `ref`.`referee_id`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_user_annual_points`
--
DROP TABLE IF EXISTS `v_user_annual_points`;

CREATE ALGORITHM=UNDEFINED DEFINER=`mpuga`@`%` SQL SECURITY DEFINER VIEW `v_user_annual_points`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`username` AS `username`, `u`.`nickname` AS `nickname`, year(`e`.`event_date`) AS `year`, coalesce(sum(`uph`.`points_earned`),0) AS `annual_points`, count(distinct `uph`.`bet_id`) AS `annual_bets`, count(distinct `uph`.`event_id`) AS `events_participated` FROM ((`users` `u` join `dim_events` `e`) left join `user_points_history` `uph` on(`u`.`user_id` = `uph`.`user_id` and `uph`.`event_id` = `e`.`event_id`)) WHERE `u`.`role` = 'user' GROUP BY `u`.`user_id`, `u`.`username`, `u`.`nickname`, year(`e`.`event_date`) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_user_event_points`
--
DROP TABLE IF EXISTS `v_user_event_points`;

CREATE ALGORITHM=UNDEFINED DEFINER=`mpuga`@`%` SQL SECURITY DEFINER VIEW `v_user_event_points`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`username` AS `username`, `u`.`nickname` AS `nickname`, `e`.`event_id` AS `event_id`, `e`.`event_name` AS `event_name`, `e`.`event_date` AS `event_date`, coalesce(sum(`uph`.`points_earned`),0) AS `event_points`, count(distinct `uph`.`bet_id`) AS `event_bets`, count(distinct case when `uph`.`points_earned` > 0 then `uph`.`bet_id` end) AS `winning_bets` FROM ((`users` `u` join `dim_events` `e`) left join `user_points_history` `uph` on(`u`.`user_id` = `uph`.`user_id` and `e`.`event_id` = `uph`.`event_id`)) WHERE `u`.`role` = 'user' GROUP BY `u`.`user_id`, `u`.`username`, `u`.`nickname`, `e`.`event_id`, `e`.`event_name`, `e`.`event_date` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_user_points_detail`
--
DROP TABLE IF EXISTS `v_user_points_detail`;

CREATE ALGORITHM=UNDEFINED DEFINER=`mpuga`@`%` SQL SECURITY DEFINER VIEW `v_user_points_detail`  AS SELECT `uph`.`point_id` AS `point_id`, `uph`.`user_id` AS `user_id`, `u`.`username` AS `username`, `u`.`nickname` AS `nickname`, `uph`.`bet_id` AS `bet_id`, `uph`.`fight_id` AS `fight_id`, `uph`.`event_id` AS `event_id`, `e`.`event_name` AS `event_name`, `e`.`event_date` AS `event_date`, `fr`.`fighter_name` AS `red_fighter`, `fb`.`fighter_name` AS `blue_fighter`, `ub`.`predicted_winner_id` AS `predicted_winner_id`, `pw`.`fighter_name` AS `predicted_winner`, `ff`.`winner_id` AS `winner_id`, `w`.`fighter_name` AS `actual_winner`, `ub`.`bet_amount` AS `bet_amount`, `ub`.`potential_return` AS `potential_return`, `uph`.`points_earned` AS `points_earned`, `uph`.`created_at` AS `created_at` FROM ((((((((`user_points_history` `uph` join `users` `u` on(`uph`.`user_id` = `u`.`user_id`)) join `user_bets` `ub` on(`uph`.`bet_id` = `ub`.`bet_id`)) join `fact_fights` `ff` on(`uph`.`fight_id` = `ff`.`fight_id`)) join `dim_events` `e` on(`uph`.`event_id` = `e`.`event_id`)) join `dim_fighters` `fr` on(`ff`.`fighter_red_id` = `fr`.`fighter_id`)) join `dim_fighters` `fb` on(`ff`.`fighter_blue_id` = `fb`.`fighter_id`)) left join `dim_fighters` `pw` on(`ub`.`predicted_winner_id` = `pw`.`fighter_id`)) left join `dim_fighters` `w` on(`ff`.`winner_id` = `w`.`fighter_id`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_user_total_points`
--
DROP TABLE IF EXISTS `v_user_total_points`;

CREATE ALGORITHM=UNDEFINED DEFINER=`mpuga`@`%` SQL SECURITY DEFINER VIEW `v_user_total_points`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`username` AS `username`, `u`.`nickname` AS `nickname`, coalesce(sum(`uph`.`points_earned`),0) AS `total_points`, count(distinct `uph`.`bet_id`) AS `total_bets`, count(distinct `uph`.`event_id`) AS `events_participated` FROM (`users` `u` left join `user_points_history` `uph` on(`u`.`user_id` = `uph`.`user_id`)) WHERE `u`.`role` = 'user' GROUP BY `u`.`user_id`, `u`.`username`, `u`.`nickname` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `app_config`
--
ALTER TABLE `app_config`
  ADD PRIMARY KEY (`config_id`),
  ADD UNIQUE KEY `config_key` (`config_key`);

--
-- Indices de la tabla `betting_odds`
--
ALTER TABLE `betting_odds`
  ADD PRIMARY KEY (`odds_id`),
  ADD KEY `fight_id` (`fight_id`),
  ADD KEY `fighter_id` (`fighter_id`),
  ADD KEY `idx_outcome_type` (`outcome_type`);

--
-- Indices de la tabla `bridge_fight_bonuses`
--
ALTER TABLE `bridge_fight_bonuses`
  ADD PRIMARY KEY (`fight_bonus_id`),
  ADD UNIQUE KEY `unique_fight_fighter_bonus` (`fight_id`,`fighter_id`,`bonus_id`),
  ADD KEY `idx_fight_bonuses` (`fight_id`),
  ADD KEY `idx_fighter_bonuses` (`fighter_id`),
  ADD KEY `idx_bonus_type` (`bonus_id`);

--
-- Indices de la tabla `dim_bonuses`
--
ALTER TABLE `dim_bonuses`
  ADD PRIMARY KEY (`bonus_id`),
  ADD KEY `idx_bonus_type` (`bonus_type_id`),
  ADD KEY `idx_event` (`event_id`);

--
-- Indices de la tabla `dim_bonus_types`
--
ALTER TABLE `dim_bonus_types`
  ADD PRIMARY KEY (`bonus_type_id`),
  ADD UNIQUE KEY `bonus_type_name` (`bonus_type_name`);

--
-- Indices de la tabla `dim_countries`
--
ALTER TABLE `dim_countries`
  ADD PRIMARY KEY (`country_id`),
  ADD UNIQUE KEY `country_name` (`country_name`),
  ADD UNIQUE KEY `country_code` (`country_code`),
  ADD KEY `idx_country_code` (`country_code`);

--
-- Indices de la tabla `dim_events`
--
ALTER TABLE `dim_events`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `idx_event_date` (`event_date`),
  ADD KEY `idx_event_name` (`event_name`),
  ADD KEY `idx_event_type` (`event_type_id`),
  ADD KEY `idx_country` (`country_id`);

--
-- Indices de la tabla `dim_event_types`
--
ALTER TABLE `dim_event_types`
  ADD PRIMARY KEY (`event_type_id`),
  ADD UNIQUE KEY `event_type_name` (`event_type_name`);

--
-- Indices de la tabla `dim_fighters`
--
ALTER TABLE `dim_fighters`
  ADD PRIMARY KEY (`fighter_id`),
  ADD KEY `stance_id` (`stance_id`),
  ADD KEY `idx_fighter_name` (`fighter_name`),
  ADD KEY `idx_country` (`country_id`);

--
-- Indices de la tabla `dim_fight_categories`
--
ALTER TABLE `dim_fight_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`),
  ADD UNIQUE KEY `category_code` (`category_code`);

--
-- Indices de la tabla `dim_fight_methods`
--
ALTER TABLE `dim_fight_methods`
  ADD PRIMARY KEY (`method_id`),
  ADD UNIQUE KEY `method_name` (`method_name`),
  ADD KEY `idx_method_category` (`method_category`);

--
-- Indices de la tabla `dim_fight_results`
--
ALTER TABLE `dim_fight_results`
  ADD PRIMARY KEY (`fight_result_id`),
  ADD UNIQUE KEY `result_name` (`result_name`);

--
-- Indices de la tabla `dim_genders`
--
ALTER TABLE `dim_genders`
  ADD PRIMARY KEY (`gender_id`),
  ADD UNIQUE KEY `gender_name` (`gender_name`);

--
-- Indices de la tabla `dim_rankings`
--
ALTER TABLE `dim_rankings`
  ADD PRIMARY KEY (`ranking_id`),
  ADD KEY `idx_fighter_ranking` (`fighter_id`,`effective_date`),
  ADD KEY `idx_weight_class_ranking` (`weight_class_id`,`rank_position`,`effective_date`);

--
-- Indices de la tabla `dim_referees`
--
ALTER TABLE `dim_referees`
  ADD PRIMARY KEY (`referee_id`),
  ADD KEY `idx_referee_name` (`referee_name`),
  ADD KEY `idx_country` (`country_id`);

--
-- Indices de la tabla `dim_stances`
--
ALTER TABLE `dim_stances`
  ADD PRIMARY KEY (`stance_id`),
  ADD UNIQUE KEY `stance_name` (`stance_name`);

--
-- Indices de la tabla `dim_time`
--
ALTER TABLE `dim_time`
  ADD PRIMARY KEY (`time_id`),
  ADD UNIQUE KEY `full_date` (`full_date`),
  ADD KEY `idx_full_date` (`full_date`),
  ADD KEY `idx_year_month` (`year`,`month`);

--
-- Indices de la tabla `dim_weight_classes`
--
ALTER TABLE `dim_weight_classes`
  ADD PRIMARY KEY (`weight_class_id`),
  ADD UNIQUE KEY `class_name` (`class_name`),
  ADD KEY `idx_class_name` (`class_name`),
  ADD KEY `idx_gender` (`gender_id`);

--
-- Indices de la tabla `fact_fights`
--
ALTER TABLE `fact_fights`
  ADD PRIMARY KEY (`fight_id`),
  ADD KEY `referee_id` (`referee_id`),
  ADD KEY `idx_event_fights` (`event_id`),
  ADD KEY `idx_fighter_red_fights` (`fighter_red_id`),
  ADD KEY `idx_fighter_blue_fights` (`fighter_blue_id`),
  ADD KEY `idx_weight_class_fights` (`weight_class_id`),
  ADD KEY `idx_fight_date` (`time_id`),
  ADD KEY `idx_title_fights` (`is_title_fight`),
  ADD KEY `idx_method` (`method_id`),
  ADD KEY `idx_fight_result` (`fight_result_id`),
  ADD KEY `idx_winner` (`winner_id`),
  ADD KEY `idx_fight_category` (`fight_category_id`),
  ADD KEY `idx_result_type_code` (`result_type_code`),
  ADD KEY `idx_display_order` (`event_id`,`display_order`);

--
-- Indices de la tabla `invitation_tokens`
--
ALTER TABLE `invitation_tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `used_by` (`used_by`),
  ADD KEY `revoked_by` (`revoked_by`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_used_at` (`used_at`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indices de la tabla `predictions`
--
ALTER TABLE `predictions`
  ADD PRIMARY KEY (`prediction_id`),
  ADD UNIQUE KEY `unique_user_fight` (`user_id`,`fight_id`),
  ADD KEY `fight_id` (`fight_id`);

--
-- Indices de la tabla `registration_tokens`
--
ALTER TABLE `registration_tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `used_by` (`used_by`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_is_used` (`is_used`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `country_id` (`country_id`),
  ADD KEY `idx_nickname` (`nickname`);

--
-- Indices de la tabla `user_bets`
--
ALTER TABLE `user_bets`
  ADD PRIMARY KEY (`bet_id`),
  ADD UNIQUE KEY `unique_user_fight_bet` (`user_id`,`fight_id`),
  ADD KEY `predicted_winner_id` (`predicted_winner_id`),
  ADD KEY `idx_user_bets` (`user_id`),
  ADD KEY `idx_fight_bets` (`fight_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_user_bets_event_id` (`event_id`);

--
-- Indices de la tabla `user_points_history`
--
ALTER TABLE `user_points_history`
  ADD PRIMARY KEY (`point_id`),
  ADD UNIQUE KEY `unique_bet_points` (`bet_id`),
  ADD KEY `fk_points_fight` (`fight_id`),
  ADD KEY `idx_user_points` (`user_id`),
  ADD KEY `idx_event_points` (`event_id`),
  ADD KEY `idx_bet_points` (`bet_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `app_config`
--
ALTER TABLE `app_config`
  MODIFY `config_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT de la tabla `betting_odds`
--
ALTER TABLE `betting_odds`
  MODIFY `odds_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT de la tabla `bridge_fight_bonuses`
--
ALTER TABLE `bridge_fight_bonuses`
  MODIFY `fight_bonus_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `dim_bonuses`
--
ALTER TABLE `dim_bonuses`
  MODIFY `bonus_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `dim_bonus_types`
--
ALTER TABLE `dim_bonus_types`
  MODIFY `bonus_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `dim_countries`
--
ALTER TABLE `dim_countries`
  MODIFY `country_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `dim_events`
--
ALTER TABLE `dim_events`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `dim_event_types`
--
ALTER TABLE `dim_event_types`
  MODIFY `event_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `dim_fighters`
--
ALTER TABLE `dim_fighters`
  MODIFY `fighter_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT de la tabla `dim_fight_categories`
--
ALTER TABLE `dim_fight_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `dim_fight_methods`
--
ALTER TABLE `dim_fight_methods`
  MODIFY `method_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `dim_fight_results`
--
ALTER TABLE `dim_fight_results`
  MODIFY `fight_result_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `dim_genders`
--
ALTER TABLE `dim_genders`
  MODIFY `gender_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `dim_rankings`
--
ALTER TABLE `dim_rankings`
  MODIFY `ranking_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `dim_referees`
--
ALTER TABLE `dim_referees`
  MODIFY `referee_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `dim_stances`
--
ALTER TABLE `dim_stances`
  MODIFY `stance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `dim_time`
--
ALTER TABLE `dim_time`
  MODIFY `time_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `dim_weight_classes`
--
ALTER TABLE `dim_weight_classes`
  MODIFY `weight_class_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `fact_fights`
--
ALTER TABLE `fact_fights`
  MODIFY `fight_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `invitation_tokens`
--
ALTER TABLE `invitation_tokens`
  MODIFY `token_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `predictions`
--
ALTER TABLE `predictions`
  MODIFY `prediction_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `registration_tokens`
--
ALTER TABLE `registration_tokens`
  MODIFY `token_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `user_bets`
--
ALTER TABLE `user_bets`
  MODIFY `bet_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=249;

--
-- AUTO_INCREMENT de la tabla `user_points_history`
--
ALTER TABLE `user_points_history`
  MODIFY `point_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `betting_odds`
--
ALTER TABLE `betting_odds`
  ADD CONSTRAINT `betting_odds_ibfk_1` FOREIGN KEY (`fight_id`) REFERENCES `fact_fights` (`fight_id`),
  ADD CONSTRAINT `betting_odds_ibfk_2` FOREIGN KEY (`fighter_id`) REFERENCES `dim_fighters` (`fighter_id`);

--
-- Filtros para la tabla `bridge_fight_bonuses`
--
ALTER TABLE `bridge_fight_bonuses`
  ADD CONSTRAINT `bridge_fight_bonuses_ibfk_1` FOREIGN KEY (`fight_id`) REFERENCES `fact_fights` (`fight_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bridge_fight_bonuses_ibfk_2` FOREIGN KEY (`fighter_id`) REFERENCES `dim_fighters` (`fighter_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bridge_fight_bonuses_ibfk_3` FOREIGN KEY (`bonus_id`) REFERENCES `dim_bonuses` (`bonus_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `dim_bonuses`
--
ALTER TABLE `dim_bonuses`
  ADD CONSTRAINT `dim_bonuses_ibfk_1` FOREIGN KEY (`bonus_type_id`) REFERENCES `dim_bonus_types` (`bonus_type_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dim_bonuses_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `dim_events` (`event_id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `dim_events`
--
ALTER TABLE `dim_events`
  ADD CONSTRAINT `dim_events_ibfk_1` FOREIGN KEY (`event_type_id`) REFERENCES `dim_event_types` (`event_type_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dim_events_ibfk_2` FOREIGN KEY (`country_id`) REFERENCES `dim_countries` (`country_id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `dim_fighters`
--
ALTER TABLE `dim_fighters`
  ADD CONSTRAINT `dim_fighters_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `dim_countries` (`country_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `dim_fighters_ibfk_2` FOREIGN KEY (`stance_id`) REFERENCES `dim_stances` (`stance_id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `dim_rankings`
--
ALTER TABLE `dim_rankings`
  ADD CONSTRAINT `dim_rankings_ibfk_1` FOREIGN KEY (`fighter_id`) REFERENCES `dim_fighters` (`fighter_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dim_rankings_ibfk_2` FOREIGN KEY (`weight_class_id`) REFERENCES `dim_weight_classes` (`weight_class_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `dim_referees`
--
ALTER TABLE `dim_referees`
  ADD CONSTRAINT `dim_referees_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `dim_countries` (`country_id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `dim_weight_classes`
--
ALTER TABLE `dim_weight_classes`
  ADD CONSTRAINT `dim_weight_classes_ibfk_1` FOREIGN KEY (`gender_id`) REFERENCES `dim_genders` (`gender_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `fact_fights`
--
ALTER TABLE `fact_fights`
  ADD CONSTRAINT `fact_fights_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `dim_events` (`event_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fact_fights_ibfk_2` FOREIGN KEY (`time_id`) REFERENCES `dim_time` (`time_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fact_fights_ibfk_3` FOREIGN KEY (`weight_class_id`) REFERENCES `dim_weight_classes` (`weight_class_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fact_fights_ibfk_4` FOREIGN KEY (`referee_id`) REFERENCES `dim_referees` (`referee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fact_fights_ibfk_5` FOREIGN KEY (`fighter_red_id`) REFERENCES `dim_fighters` (`fighter_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fact_fights_ibfk_6` FOREIGN KEY (`fighter_blue_id`) REFERENCES `dim_fighters` (`fighter_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fact_fights_ibfk_7` FOREIGN KEY (`winner_id`) REFERENCES `dim_fighters` (`fighter_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fact_fights_ibfk_8` FOREIGN KEY (`fight_result_id`) REFERENCES `dim_fight_results` (`fight_result_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fact_fights_ibfk_9` FOREIGN KEY (`method_id`) REFERENCES `dim_fight_methods` (`method_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_fight_category` FOREIGN KEY (`fight_category_id`) REFERENCES `dim_fight_categories` (`category_id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `invitation_tokens`
--
ALTER TABLE `invitation_tokens`
  ADD CONSTRAINT `invitation_tokens_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invitation_tokens_ibfk_2` FOREIGN KEY (`used_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `invitation_tokens_ibfk_3` FOREIGN KEY (`revoked_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `predictions`
--
ALTER TABLE `predictions`
  ADD CONSTRAINT `predictions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `predictions_ibfk_2` FOREIGN KEY (`fight_id`) REFERENCES `fact_fights` (`fight_id`);

--
-- Filtros para la tabla `registration_tokens`
--
ALTER TABLE `registration_tokens`
  ADD CONSTRAINT `registration_tokens_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `registration_tokens_ibfk_2` FOREIGN KEY (`used_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `dim_countries` (`country_id`);

--
-- Filtros para la tabla `user_bets`
--
ALTER TABLE `user_bets`
  ADD CONSTRAINT `fk_user_bets_event` FOREIGN KEY (`event_id`) REFERENCES `dim_events` (`event_id`),
  ADD CONSTRAINT `user_bets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_bets_ibfk_2` FOREIGN KEY (`fight_id`) REFERENCES `fact_fights` (`fight_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_bets_ibfk_3` FOREIGN KEY (`predicted_winner_id`) REFERENCES `dim_fighters` (`fighter_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_points_history`
--
ALTER TABLE `user_points_history`
  ADD CONSTRAINT `fk_points_bet` FOREIGN KEY (`bet_id`) REFERENCES `user_bets` (`bet_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_points_event` FOREIGN KEY (`event_id`) REFERENCES `dim_events` (`event_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_points_fight` FOREIGN KEY (`fight_id`) REFERENCES `fact_fights` (`fight_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_points_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
