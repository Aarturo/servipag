# servipag
No es complemento oficial, simplemente es la manera en que implemente el servicio del boton 2.0.

* Primero importar la libreria
```javascript
  import Servipag from "servipag";
```

* Agregar variables ambientales @TODO cambiar a una manera mas elegante el agregar ORDENFIRMA
```bash
RUTALLAVEPRIVADA="./crt/privada.key"
RUTALLAVEPUBLICA="./crt/publica.key"
CANALSERVIPAG=523
ORDENFIRMA="["FechaPago", "MontoTotalDeuda", "NumeroBoletas", "IdSubTx", "Boleta", "Monto", "FechaVencimiento"]"
```

* Generar el primer xml
```javascript
/**
 * Creates the payment
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 * @return {Json}
 */
export function servipagIniciar(req, res, next) {
	const order = randomstring.generate(30)
	const boleta = randomstring.generate(20)
	const identificador = randomstring.generate(20)
	const date = moment().format('YYYYMMDD')

	User.findOne({_id: req.body.id}).exec(function (err, userFound){
		if (err) {
			res.status(500).json({success: false, message: err})
		} else {
			........
			........

			payment.save(function (erro, newPayment){
				if (erro) {
					res.status(500).json({success: false, message: erro})
				} else {
					const servipag = Servipag.create()
					const xml = servipag.generarXml1({
						Boleta: boleta,
						CodigoCanalPago: config.canalservipag,
						FechaPago: date,
						FechaVencimiento: date,
						Identificador: identificador,
						IdSubTx: 1,
						Monto: req.body.price,
						MontoTotalDeuda: req.body.price,
						NumeroBoletas: 1,
						IdTxPago: order,
						EmailCliente: userFound.email,
						NombreCliente: userFound.username,
						RutCliente: "",
						Version: 2
					})
					console.servipag("creo pago en servipag", newPayment._id)
					res.json({success: true, message: xml})
				}
			})
		}
	})
}
```
* Recibir la notificacion, xml2, con el resultado del pago y enviar xml3
```javascript
/**
 * Retry
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 * @return {String}
 */
export function servipagnotify(req, res, next) {
	const servipag = Servipag.create()
	console.servipag("recibo xml2:" , req.body.XML)
	let result = servipag.validarXml2(req.body.XML)
	console.servipag("validacion:", result.exito)
	let data = {CodigoRetorno: 1, MensajeRetorno: "Trasaccion Mala"}
	let estado = 3

	if (result.exito === true) {
		data.CodigoRetorno = 0
		data.MensajeRetorno = "Trasaccion OK"
		estado = 1
	}

	if (typeof result.mensaje.IdTxCliente == "undefined") {
		result.mensaje = {}
		result.mensaje.IdTxCliente = ""
	}
	console.servipag("busco pago en bd", result.mensaje.IdTxCliente)
	Payment.findOneAndUpdate(
		{"system_payment.IDTXPAGO": result.mensaje.IdTxCliente},
		{$set: {status: estado, "system_payment.MENSAJE": result.mensaje.MensajePago, "system_payment.ESTADOPAGO": result.mensaje.EstadoPago}},
		{new: 1},
		function (err, foundPayment) {
			if (err) {
				res.status(409).json({success: false, message: "couldn't find the payment"})
			} else {
				if (!foundPayment) {
					console.log("pago no encontrado")
				}
				const xml3 = servipag.generarXml3(data)
				console.servipag("genero xml3", xml3)
				res.send(xml3);
			}
		}
	)
}
```
* Recibir el contexto desde servipag, usuario vuelve a la aplicación
```javascript
/**
 * Receive the transaction result
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
export function servipagcontext(req, res, next){

	const servipag = Servipag.create()
	let xml = req.params.xml
	console.servipag("datos xml4:" , xml)
	let result = servipag.validarXml4(xml)
	console.servipag("valido xml4", result.exito)
	if (typeof result.mensaje.IdTxCliente == "undefined") {
		result.mensaje = {}
		result.mensaje.IdTxCliente = ""
	}

	Payment.findOne(
		{"system_payment.IDTXPAGO": result.mensaje.IdTxCliente}, function (err, foundPayment) {
			if (err) {
				res.status(409).json({success: false, message: "couldn't find the payment"})
			} else {
				if (foundPayment) {
					if (result.mensaje.EstadoPago == 0) {
						console.servipag("compra terminada con exito", foundPayment._id);
						User.findOne({_id: foundPayment.user}, (erro, foundUser) => {
								if (erro) {
									console.servipag("no se pudo al usuario", foundPayment.user)
									res.redirect(config.urlBase + "/home/centrodepago/fail/id/" + foundPayment.user);
								} else {																		
									foundUser.subscription.end = foundPayment.ending;
									foundUser.save((er) => {
										if (er) {
											console.servipag("no se pudo crear la suscripcion", foundPayment.user)
											res.redirect(config.urlBase + "/home/centrodepago/fail/id/" + foundUser._id);	
										} else {
											res.redirect(config.urlBase + "/home/centrodepago/success/id/" + foundUser._id);
										}
									});
								}
							}
						);
					} else {
						console.servipag("compra fallida", foundPayment._id)
						res.redirect(config.urlBase + "/home/centrodepago/fail/id/" + foundPayment.user)
					}
				} else {
					console.servipag("pago no fue creado", result)
					res.redirect(config.urlBase + "/home/centrodepago/fail/");
				}
			}
		}
	)
}
```