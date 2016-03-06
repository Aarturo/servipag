'use strict';

import async from 'async';
import config from '../lib/config';
import {expect} from 'chai';
import fs from 'fs';
import {parseString, Builder} from 'xml2js';
import path from 'path';
import Servipag from '../lib';
import ursa from 'ursa';

const data = {
  FirmaEPS: 'PjywWBrcmIScfe82NUwNiHSzhVs0CwtHGwlRBOiQiNONLpsHz1jvhhU9T20aZxhVJD4waPa5hXlX95FYUdDwsSm6lDguLk5JDWxQHlwkVMenqrhJ+2HDXGqg8DNqNXD0JtAoba0eh56Krs2H2Y1q2WJgF38JidcchekdoTXIvlw=',
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
  EmailCliente: 'jp@test.com',
  NombreCliente: 'Juan Perez',
  RutCliente: '11111111-1',
  Version: 2
};
const builderOptions = {
  renderOpts: {pretty: false},
  xmldec: {encoding: 'ISO-8859-1', standalone: null}
};

describe('Test Servipag', function(){
  let servipag;

  before(() => {
    servipag = new Servipag();
  });

  it('Valida el concatenar para la firma', () => {
    const concatenado = servipag.concatFirma(data);
    expect(concatenado).to.eql(`${data.Boleta}${data.CodigoCanalPago}${data.FechaPago}${data.FechaVencimiento}${data.Identificador}${data.IdSubTx}${data.Monto}${data.MontoTotalDeuda}${data.NumeroBoletas}`);
  });

  it('Firma y comprueba el firmado', () => {
    const concatenado = servipag.concatFirma(data);
    const firma = servipag.encripta(concatenado);
    expect(firma).to.eql(data.FirmaEPS);
  });

  it('Comprueba generar el primer xml', (done) => {
    const xml = servipag.generarXml1(data);
    const builder = new Builder(builderOptions);
    async.waterfall([
      async.apply(fs.readFile, path.join(__dirname, 'xml', '1.xml')),
      parseString
    ], (err, obj) => {
      if (err) return done(err);
      expect(xml).to.eql(builder.buildObject(obj));
      done();
    });
  });

  it('Comprueba generar el tercer xml', (done) => {
    const xml = servipag.generarXml3({CodigoRetorno: 0, MensajeRetorno: 'Transacción OK'});
    const builder = new Builder(builderOptions);
    async.waterfall([
      async.apply(fs.readFile, path.join(__dirname, 'xml', '3.xml')),
      parseString
    ], (err, obj) => {
      if (err) return done(err);
      expect(xml).to.eql(builder.buildObject(obj));
      done();
    });
  });

  // it('Comprueba xml4', (done) => {
  //   const resultadoxml4ficticio = {FirmaServipag : '12345678910', IdTrxServipag: '123456', IdTxCliente: '78910', EstadoPago: '1', MensajePago: 'Completado'};
  //   async.waterfall([
  //     async.apply(fs.readFile, path.join(__dirname, 'xml', '4.xml')),
  //     servipag.validarXml4
  //   ], (err, xml4) => {
  //     if (err) return done(err);
  //     console.log(xml4.mensaje);
  //     console.log(resultadoxml4ficticio);
  //     done();
  //   });
  // });

  it('Comprueba desencriptar llave publica', () => {
    //cadena para firmar que se formaria con los valores que llegarían en resultadoxml4ficticio
    const cadena = '12345678910';
    //firma que haría servipag
    const llaveprivada = ursa.createPrivateKey(fs.readFileSync(config.rutallaveprivada));
    const firma = llaveprivada.sign('md5', cadena, 'utf8', 'base64');
    // console.log(firma);
    //verificación que haría el comercio
    const resultado = servipag.desencriptar(cadena, firma);
    expect(resultado).to.be.true;
  });
});
