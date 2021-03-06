var express = require('express');
var router = express.Router();
var Votante = require('../models/votante');
var Candidato = require('../models/candidato');

/* GET votar page */
router.get('/', function (req, res, next){
    res.render('votar', { title: 'Elecciones'});
});

/* POST Ruteo para registrar un votante */
router.post('/', function(req, res, next){
    var votante = new Votante(
        {
            nombre: req.body.nombre,
            apellido: req.body.apellido,
            dni: req.body.dni,
            sexo: req.body.sexo
        }
    );
    var dni = req.body.dni
    if(Votante.findOne({ dni: dni }, function(err, response){
        if (err) {
            res.render('votar', { title: 'Elecciones', error: err.message });
        }
        if (response != null && response.estadoVoto == true) {
            res.render('votar', { title: 'Elecciones', error: 'Ya se ha votado con el DNI ingresado. ' });
        }
        else {
            if(response == null){
                votante.save(function (err, response) {
                    if (err) {
                        return res.render('votar', { title: 'Elecciones' , error: err.message});
                    }
                    if (response == null){
                        return res.render('votar', { title: 'Elecciones', error: "No se pudo registrar al votante..."})
                    }
                    res.redirect('/votar/elegirCandidato/' + dni);
                });
            }
            else {
                Votante.update({_id: response._id}, { nombre:req.body.nombre, apellido: req.body.apellido, sexo: req.body.sexo }, function (err, res){
                    if(err) {
                        return res.render('votar', { title: 'Elecciones', error: err.message});
                    }
                    if(res == null){
                        return res.render('votar', { title: 'Elecciones', error: "No se pudo registrar al votante..."});
                    }
                });
                res.redirect('/votar/elegirCandidato/' + dni);
            }
        }
    }));
});

/* GET candidatos */
router.get('/elegirCandidato/:dni', function(req, res, next){
    var dni = req.params.dni;
    Candidato.find({}, function(err, candidatos){
        if(err != null){
            res.status(400).send(new Error("Error: " + err.message));
        }
        if(candidatos == null){
            res.status(404).send(new Error("No hay candidatos..."));
        }
        res.render('elegirCandidato', { title: 'Elecciones', candidatos:candidatos , dni: dni });
    });
});

/* POST elegir candidato y registrar voto */
router.post('/elegirCandidato', function (req, res, next){
    // var votante = new Votante({
    //     dni: req.body.dni
    // });
    // var candidato = new Candidato({
    //     _id: req.body._id
    // });
    Votante.findOne({ dni: req.body.dni }, function(err, response){
        if (err) {
            //next(err);
            res.render('votar', { title: 'Elecciones', error: err.message });
        }
        if (response == null){
            res.render('votar', { title: 'Elecciones', error: "Primero tiene que ingresar sus datos para poder votar"} );
        }
        else if (response != null && response.estadoVoto == true) {
            res.redirect('votar', { title: 'Elecciones', error: 'Ya se ha votado con el DNI ingresado. ' });
        }
        else {
            Candidato.findById(req.body._id, function (err, rescandidato){
                if (err) {
                    res.render('votar', { title: 'Elecciones', error: err.message });
                    //next(err)
                }
                if (rescandidato == null) {
                    res.render('votar', { title: 'Elecciones', error: 'No existe el candidato ' });
                }
                else{
                    Votante.update({_id: response._id}, { estadoVoto: true }, function (err,res){
                        if(err){
                            res.render('votar', { title: 'Elecciones', error: err.message });
                            //next(err);
                        }
                        if(res==null){
                            res.render('votar', { title: 'Elecciones', error: 'DNI incorrecto' });
                        }
                    });
                    Candidato.update({_id: rescandidato._id}, { cantidadVotos: rescandidato.cantidadVotos + 1 }, function(err, res){
                        if(err){
                            res.render('votar', { title: 'Elecciones', error: err.message });
                           //next(err);
                        }
                        if(res==null){
                            res.render('votar', { title: 'Elecciones', error: 'No existe el candidato' });
                        }
                    });
                    res.redirect('/estadisticas');
                }
            });
        }
    });
});

module.exports = router;