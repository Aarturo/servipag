"use strict"

var fs = require('fs');
var ursa = require('ursa');
var config = require('../config/')

/**
 * Constructor
 */
function Servipag() {
	this.rutaLlavePrivada = config.rutallaveprivada;
	this.rutaLlavePublica = config.rutallavepublica;
	if (typeof config.ordenfirma == 'String') {
		this.ordenfirma = eval(config.ordenfirma);
	} else {
		this.ordenfirma = config.ordenfirma;
	}	
	this.ordennodoxml2 = config.ordennodoxml2
	this.ordennodoxml4 = config.ordennodoxml4;
	this.firma = '';
	this.xml1 = [];
	this.xml1.cabeceras = ['FirmaEPS', 'CodigoCanalPago', 'IdTxPago', 'EmailCliente', 'NombreCliente', 'RutCliente', 'FechaPago', 'MontoTotalDeuda', 'NumeroBoletas', 'Version'];
	this.xml1.documentos = ['IdSubTx', 'Identificador', 'Boleta', 'Monto', 'FechaVencimiento'];
	this.xml2 = ['FirmaServipag', 'IdTrxServipag', 'IdTxCliente', 'FechaPago', 'CodMedioPago', 'FechaContable', 'CodigoIdentificador', 'Boleta', 'Monto'];
	this.xml3 = ['CodigoRetorno', 'MensajeRetorno'];
	this.xml4 = ['FirmaServipag', 'IdTrxServipag', 'IdTxCliente', 'EstadoPago', 'MensajePago'];
}

/**
 * Genera el primer xml para ser enviado a servipag.
 * @param  {Object} datos {Boleta: 123456, EmailCliente: "ejemplo@ejemplo.cl" ...}
 * @return {String}       xml como string concatenado
 */
Servipag.prototype.generarXml1 = function (datos) {
	var concatenados = this.concatFirma(datos);
	var firma = this.encripta(concatenados);
	// genero el comienzo del xml
	var xml1 = "<?xml version='1.0' encoding='ISO-8859-1'?><Servipag><Header>";
	// agrego primero la firma
	xml1 += '<FirmaEPS>' + firma + '</FirmaEPS>';
	// genero los tag del headers
	for (var i in this.xml1.cabeceras){
		if (datos.hasOwnProperty(this.xml1.cabeceras[i])) {
			xml1 += '<' + this.xml1.cabeceras[i] + '>' + datos[this.xml1.cabeceras[i]] + '</' + this.xml1.cabeceras[i] + '>';
		}
	}
	// cierro las cabeceras y abro documentos
	xml1 += '</Header><Documentos>';
	// genero los tag de documentos
	for (var i in this.xml1.documentos){
		if (datos.hasOwnProperty(this.xml1.documentos[i])) {
			xml1 += '<' + this.xml1.documentos[i] + '>' + datos[this.xml1.documentos[i]] + '</' + this.xml1.documentos[i] + '>';
		}
	}
	// cierro el documento
	xml1 += '</Documentos></Servipag>';

	return xml1;
}

/**
 * Validar xml2.
 * @param {String} xml
 * @return {Json}
 */
Servipag.prototype.validarXml2 = function (xml) {

	if (xml.indexOf('&lt;') > -1) {
		xml = xml.replace('&lt;', '<');
	}

	if (xml.indexOf('&gt;') > -1) {
		xml = xml.replace('&gt;', '>');
	}

	var xml2 = {},
		taginicio = '',
		tagcierre = '',
		cadena = '';

	for (var i in this.xml2) {
		taginicio = '<' + this.xml2[i] + '>';
		tagcierre = '</' + this.xml2[i] + '>';
		xml2[this.xml2[i]] = xml.substring(xml.search(taginicio) + taginicio.length, xml.search(tagcierre));
		for (var j in this.ordennodoxml2) {
			if (this.ordennodoxml2[j] == this.xml2[i]) {
				cadena += xml2[this.xml2[i]];
			}
		}
	}

	if (this.desencriptar(cadena, xml2['FirmaServipag'])) {
		return {exito: true, mensaje: xml2};
	} else {
		return {exito: false, mensaje: "Firma no valida"};
	}
}

/**
 * Generear xml3
 * @param  {Object} datos {CodigoRetorno: valor, MensajeRetorno: valor}
 * @return {String}       [description]
 */
Servipag.prototype.generarXml3 = function (datos) {
	// genero el comienzo del xml
	var xml3 = "<?xml version='1.0' encoding='ISO-8859-1'?><Servipag>";
	// genero los tags
	for (var i in this.xml3) {
		if (datos.hasOwnProperty(this.xml3[i])) {
			xml3 += '<' + this.xml3[i] + '>' + datos[this.xml3[i]] + '</' + this.xml3[i] + '>';
		}
	}
	// cierro el xml
	xml3 += '</Servipag>';

	return xml3;
}

/**
 * Valida el xml
 * @param  {String} xml
 * @return {Json}
 */
Servipag.prototype.validarXml4 = function (xml) {

	if (xml.indexOf('&lt;') > -1) {
		xml = xml.replace('&lt;', '<');
	}

	if (xml.indexOf('&gt;') > -1) {
		xml = xml.replace('&gt;', '>');
	}

	var xml4 = {},
		taginicio = '',
		tagcierre = '',
		cadena = '';

	for (var i in this.xml4) {
		taginicio = '<' + this.xml4[i] + '>';
		tagcierre = '</' + this.xml4[i] + '>';
		xml4[this.xml4[i]] = xml.substring(xml.search(taginicio) + taginicio.length, xml.search(tagcierre));				
		for (var j in this.ordennodoxml4) {			
			if (this.ordennodoxml4[j] == this.xml4[i]) {
				cadena += xml4[this.xml4[i]];
			}
		}
	}
	
	if (this.desencriptar(cadena, xml4['FirmaServipag'])) {
		return {exito: true, mensaje: xml4};
	} else {
		return {exito: false, mensaje: "Firma no valida"};
	}
}
/**
 * Encripta y firma la cadena enviada.
 * @param  {String}
 * @return {String}
 */
Servipag.prototype.encripta = function (cadena) {
	var llave = ursa.createPrivateKey(fs.readFileSync(this.rutaLlavePrivada));
	var firma = llave.sign('md5', cadena, 'utf8', 'base64');

	return firma;
}

/**
 * Desencripta el mensaje firmado
 * @param  {String} cadena
 * @param  {String} firma
 * @return {[type]}
 */
Servipag.prototype.desencriptar = function (cadena, firma) {
	var llave = ursa.createPublicKey(fs.readFileSync(this.rutaLlavePublica));
	var hash = new Buffer(cadena).toString('base64');
	var resultado = llave.verify('md5', hash, firma, 'base64');

	return resultado;
}
/**
 * Concatena los datos
 * @param  {[type]}
 * @return {[type]}
 */
Servipag.prototype.concatFirma = function (datos) {
	var concat = '';
	for (var i in this.ordenfirma) {
		if (datos.hasOwnProperty(this.ordenfirma[i])) {
			concat += datos[this.ordenfirma[i]];
		}
	}

	return concat;
}

/**
 * Time out predefinido.
 * @type {Number}
 */
exports.timeout = 10000;

/**
 * Exportar objeto Servipag.
 * @type {Object}
 */
exports.Servipag = Servipag;

/**
 * Instanciar objeto servipag.
 */
exports.create = function() {
	return new Servipag();
};