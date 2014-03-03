var Helios = require('helios');

var internals = {};

// Preserve correct vals when turning to strings.
internals.stringify = function (raw) {

   if (typeof raw === 'string') {

      return internals.removeControls(raw);
   }

   if (typeof raw === 'boolean') {

      return raw ? 'true' : 'false';
   }

   if (typeof raw === 'number') {

      return isFinite(raw) ? raw.toString() : '';
   }

   return '';
};

// Nasty chars that make life hell.
internals.removeControls = function (str) {

   return str.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
};

internals.SolrDoc = function (options) {

   options = options || {};

   var _doc = new Helios.document();

   var update = options.update || false;
   var fieldsSet = {};

   var setField = function (key, val, boost) {

      boost = boost || null;
      var flag = update ? 'set' : undefined;

      if (key === 'id' || key === '_version_') {

         boost = null;
         flag = undefined;
      }

      if (val === null) {

         if (update) {
            _doc.setFieldDelete(key);
         }

      } else if (!fieldsSet[key]) {

         _doc.setField(key, internals.stringify(val), boost, flag);
         fieldsSet[key] = true;

      } else {

         // TODO: There might be something wrong with this, particularly on
         // updates... But it is the only thing that works!
         _doc.setMultiValue(key, internals.stringify(val));

      }
   };

   var getDoc = function () {

      return _doc;
   };

   Object.defineProperty(this, 'get', {
      enumerable: true,
      writable: false,
      configurable: false,
      value: getDoc
   });

   Object.defineProperty(this, 'setField', {
      enumerable: true,
      writable: false,
      configurable: false,
      value: setField
   });
};

module.exports = internals.SolrDoc;
