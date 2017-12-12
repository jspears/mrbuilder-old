#!/usr/bin/env  node

process.env.MRBUILDER_INTERNAL_PRESETS =[process.env.MRBUILDER_INTERNAL_PRESETS, 'mrbuilder'].join(',');
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.NODE_PATH=`${process.cwd()}/../../node_modules/:./node_modules`;
global._MRBUILDER_OPTIONS_MANAGER = new (require('mrbuilder-optionsmanager').default)({ prefix: 'mrbuilder', _require: require });

require('mrbuilder-plugin-karma/bin/mrbuilder-karma');
