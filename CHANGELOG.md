# Changelog

0.6.1 / 2016-02-12
==================

  * update to microwork 0.7 for reconnect support

0.6.0 / 2016-02-12
==================

  * use docker volume to persist compiled components upon upgrades
  * add pipeline delete functionality
  * add component delete method
  * change repubsub to standalone library
  * replace amqplib with microwork

0.5.0 / 2016-01-28
==================

New features:
  * add username support, validate email and username uniqueness during registration
  * add way to get component with refname and username
  * allow getting pipeline info by user and refName
  * replace bootstrap-material with simpler bootswatch paper
  * add pipeline status socket
  * use better URIs for pipeline results

Fixes and minor tweaks:
  * fetch only public or user's pipelines'
  * correctly cleanup after compilation using rabbit
  * fix pipeline log output
  * fix error when querying zero size log
  * fix queue handling in services
  * fix issue with processors responses and add better rabbitmq cleanup on pipeline teardown
  * remove private source from full component info
  * fix execution and testing of pipelines with private components
  * fix webpack require modules path
  * simplify babel config
  * update deps, remove unused ones
  * correctly fill out pipeline details and users
  * only select needed user fields while getting pipelines
  * respect private source flag
  * only show public and user-owned components in list

0.4.4 / 2016-01-07
==================

  * correctly kill component runners on pipeline stop

0.4.3 / 2016-01-07
==================

  * use runner to compile render components
  * support for component versions
  * generate kebab-case refnames for components and pipelines

0.4.2 / 2016-01-05
==================

  * change removed await* to await Promise.all

0.4.1 / 2015-12-21
==================

  * allow disabling email validation

0.4.0 / 2015-12-21
==================

  * better tags for logging
  * make pipelines in test and prod modes run over rabbit
  * fix concurrent component testing
  * migrate test component execution to new runner over rabbitmq
  * exclude react and react-dom from compiled render components
  * adjust readme a bit

0.3.0 / 2015-12-16
==================

  * change from access request to plain registration
  * allow specifying hostname for emails using env var

v0.2.0 / 2015-12-15
===================

  * fix license field format in package.json & format license as markdown
  * update dockerfile and npm scripts to use env vars
  * allow using env vars for configuration
  * move email config to config.js, remove exynize email creds >_>
  * blacklist user fields that are normally not required
  * fix sending status on requests with no response
  * adjust license text

v0.1.0 / 2015-12-10
===================

  * add npm script to start server without db
  * first commit for open source version
