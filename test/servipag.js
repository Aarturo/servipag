"use strict"

var assert = require("assert");
var ursa = require("ursa");
var utf8 = require("utf8");
var Servipag = require("../lib/servipag.js");
var config = require("../config/");
var fs = require('fs');
var data = {			
			Boleta: 1,
			CodigoCanalPago: 2,
			FechaPago: 23012016,
			FechaVencimiento: 31122016,
			Identificador: 1231,
			IdSubTx: 6786,
			Monto: 23000,
			MontoTotalDeuda: 23000,
			NumeroBoletas: 1,
			IdTxPago: 23,
			EmailCliente: "jp@test.com",
			NombreCliente: "Juan Perez",
			RutCliente: "11111111-1",
			Version: 2
		};
var xml2ficticio = '<?xml version="1.0" encoding="ISO-8859-1"?><Servipag><FirmaServipag>p2ZEtKT8J6cj8nKFKNo7srUhwtqwwyHyJvC/dq0YeDFKcc6FRzUIbktIW7KuR1uX4q6FHeVjCaaM2aPHm0h6c76zjWexy3SfsElNQlkyAOzUzMjafiueUwZyEpmEhl6KV8xcwLrFjiXkUdKHQoqN8xvyHhFQxM/RVVX8+xM64uo=</FirmaServipag><IdTrxServipag>1234</IdTrxServipag><IdTxCliente>5678</IdTxCliente><FechaPago>20160331</FechaPago><CodMedioPago>BC2016</CodMedioPago><FechaContable>20160308</FechaContable><CodigoIdentificador>ASFDG125361235GG</CodigoIdentificador><Boleta>123456789123345456</Boleta><Monto>10</Monto></Servipag>';
var resultadoxml2ficticio = {FirmaServipag: 'p2ZEtKT8J6cj8nKFKNo7srUhwtqwwyHyJvC/dq0YeDFKcc6FRzUIbktIW7KuR1uX4q6FHeVjCaaM2aPHm0h6c76zjWexy3SfsElNQlkyAOzUzMjafiueUwZyEpmEhl6KV8xcwLrFjiXkUdKHQoqN8xvyHhFQxM/RVVX8+xM64uo=', IdTrxServipag: '1234', IdTxCliente: '5678', FechaPago: '20160331', CodMedioPago: 'BC2016', FechaContable: '20160308', CodigoIdentificador: 'ASFDG125361235GG', Boleta: '123456789123345456', Monto: '10'};
var xml4ficticio = '<?xml version="1.0" encoding="ISO-8859-1"?><Servipag><FirmaServipag>LNUmlhUcWyyB/bpTumyOcozvTqOMmYYXh9RnKm7/Xyn0jyOLl17DpsKTJyaEdg4NiP+C8B8nJMX+Q1yF4Zt3M3uuNVa88QAgmMSZlR7oAnKox2/5B3DtrhL0ASPdw6E5UezjSJed1lqGFRkMxk0HYkvSy8c4ZmW9DHewSFvSzRk=</FirmaServipag><IdTrxServipag>123456</IdTrxServipag><IdTxCliente>78910</IdTxCliente><EstadoPago>1</EstadoPago><MensajePago>Completado</MensajePago></Servipag>' ;
var resultadoxml4ficticio = {FirmaServipag : 'LNUmlhUcWyyB/bpTumyOcozvTqOMmYYXh9RnKm7/Xyn0jyOLl17DpsKTJyaEdg4NiP+C8B8nJMX+Q1yF4Zt3M3uuNVa88QAgmMSZlR7oAnKox2/5B3DtrhL0ASPdw6E5UezjSJed1lqGFRkMxk0HYkvSy8c4ZmW9DHewSFvSzRk=', IdTrxServipag: '123456', IdTxCliente: '78910', EstadoPago: '1', MensajePago: 'Completado'};

describe("Test Servipag", function(){
	it("Valida el concatenar para la firma", function (done){
		var servipag = Servipag.create();
		var concatenado = servipag.concatFirma(data);
		assert.equal(concatenado, "1223012016311220161231678623000230001");
		done();
	});

	it("Firma y comprueba el firmado", function (done){
		var servipag = Servipag.create();
		var concatenado = servipag.concatFirma(data);
		var firma = servipag.encripta(concatenado);
		assert.ok(firma);
		done();
	});

	it("Comprueba generar el primer xml", function (done) {
		var servipag = Servipag.create();
		var xml1 = servipag.generarXml1(data);
		assert.equal(xml1, "<?xml version='1.0' encoding='ISO-8859-1'?><Servipag><Header><FirmaEPS>AsGM0kPHK2gCcPfD061k6k2uoxQFs3i4zZVOGGe7cv0Y1z4ue80nQ/NhxklbntEPZWMnuwqh7cQ/Xzmh/VFNYRYyuesQgxjrEYgldettLqbDKD9CnPPl6Ngfj1ufycvR/98dpIZR0mHNlE45GcFndBzKJ3YNhtDTrZmF1bKfKao=</FirmaEPS><CodigoCanalPago>2</CodigoCanalPago><IdTxPago>23</IdTxPago><EmailCliente>jp@test.com</EmailCliente><NombreCliente>Juan Perez</NombreCliente><RutCliente>11111111-1</RutCliente><FechaPago>23012016</FechaPago><MontoTotalDeuda>23000</MontoTotalDeuda><NumeroBoletas>1</NumeroBoletas><Version>2</Version></Header><Documentos><IdSubTx>6786</IdSubTx><Identificador>1231</Identificador><Boleta>1</Boleta><Monto>23000</Monto><FechaVencimiento>31122016</FechaVencimiento></Documentos></Servipag>");
		done();
	});

	it("Comprueba generar el tercer xml", function (done) {
		var servipag = Servipag.create();
		var xml3 = servipag.generarXml3({CodigoRetorno: 0, MensajeRetorno: 'Transacción OK'});
		assert.equal(xml3, "<?xml version='1.0' encoding='ISO-8859-1'?><Servipag><CodigoRetorno>0</CodigoRetorno><MensajeRetorno>Transacción OK</MensajeRetorno></Servipag>");
		done();
	})
	
	it("Comprueba desencriptar llave publica", function (done) {
		//cadena para firmar que se formaria con los valores que llegarían en resultadoxml4ficticio
		var cadena = '12345678910';
		//firma que haría servipag
		var llaveprivada = ursa.createPrivateKey(fs.readFileSync(config.rutallaveprivada));
		var firma = llaveprivada.hashAndSign('md5', utf8.encode(cadena), 'utf8', 'base64');		
		//verificación que haría el comercio
		var servipag = Servipag.create();
		var resultado = servipag.desencriptar(cadena, firma);

		assert.ok(resultado);
		done();
	})

	it("Comprueba xml2", function (done) {
		var servipag = Servipag.create();
		var xml2 = servipag.validarXml2(xml2ficticio);		
		assert.deepEqual(xml2.mensaje, resultadoxml2ficticio);
		done();
	})
	it("Comprueba xml4", function (done) {
		var servipag = Servipag.create();
		var xml4 = servipag.validarXml4(xml4ficticio);		
		assert.deepEqual(xml4.mensaje, resultadoxml4ficticio);
		done();
	});

});
