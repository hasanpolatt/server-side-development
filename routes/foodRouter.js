const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');

const Foods = require('../models/food');

const foodRouter = express.Router();

foodRouter.use(bodyParser.json());

foodRouter.route('/')
.get((req, res, next) => {
    Foods.find({})
    .populate('comments.author')
    .then((foods) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(foods);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Foods.create(req.body)
    .then((food) => {
        res.statusCode = 201;
        res.setHeader("Content-Type", "application/json");
        res.json(food);
        console.log("Food");
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('put operation is not supported');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Foods.remove({})
    .then((result) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(result);
    }, (err) => next(err))
    .catch((err) => next(err));
})

foodRouter.route('/:foodId')
.get((req, res, next) => {
    Foods.findById(req.params.foodId)
    .populate('comments.author')
    .then((foods) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(foods);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('post operation is not supported' + req.params.foodId);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Foods.findByIdAndUpdate(req.params.foodId,
        {$set: req.body}, {new: true})
        .then((food) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(food);
        }, (err) => next(err))
        .catch((err) => next(err));
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Foods.findByIdAndRemove(req.params.foodId)
    .then((result) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(result);
    }, (err) => next(err))
    .catch((err) => next(err));
});

foodRouter.route('/:foodId/comments')
.get((req, res, next) => {
    Foods.findById(req.params.foodId)
    .populate('comments.author')
    .then((food) => {
        if (food != null) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(food.comments);
        } else {
            err = new Error(req.params.foodId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    Foods.findById(req.params.foodId
        ).then((food) => {
        if (food != null) {
            req.body.author = req.user._id;
            food.comments.push(req.body);
            food.save().then((food) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(food);
            }, (err) => next(err))
            .catch((err) => next(err));
        } else {
            err = new Error(req.params.foodId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('put operation is not supported' + req.params.foodId);
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Foods.findById(req.params.foodId)
    .then((food) => {
        if (food != null) {
            console.log(food);
            for (var i = (food.comments.length - 1); i >= 0; i--) {
                food.comments.id(food.comments[i]._id).remove();
            }
            food.save()
            .then((food) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(food);
            }, (err) => next(err))
            .catch((err) => next(err));
        } else {
            err = new Error(req.params.foodId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

foodRouter.route('/:foodId/comments/:commentId')
.get((req, res, next) => {
    Foods.findById(req.params.foodId)
    .populate('comments.author')
    .then((food) => {
        if (food != null && food.comments.id(req.params.commentId)) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(food.comments.id(req.params.commentId));
        } else if (food == null) {
            err = new Error(req.params.foodId + ' not found');
            err.status = 404;
            return next(err);
        } else {
            err = new Error(req.params.commentId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('post operation is not supported' + req.params.foodId + '/comments/' + req.params.commentId);
})
.put(authenticate.verifyUser, (req, res, next) => {
    Foods.findById(req.params.foodId)
    .then((food) => {
        if (food != null && food.comments.id(req.params.commentId)) {
            if (food.comments.id(req.params.commentId).author.toString() != req.user._id.toString()) {
                err = new Error('not authorized');
                err.status = 403;
                return next(err);
            }
            if (req.body.rating) {
                food.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.comment) {
                food.comments.id(req.params.commentId).comment = req.body.comment;
            }
            food.save()
            .then((food) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(food);
            }, (err) => next(err))
            .catch((err) => next(err));
        } else if (food == null) {
            err = new Error(req.params.foodId + ' not found');
            err.status = 404;
            return next(err);
        } else {
            err = new Error(req.params.commentId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Foods.findById(req.params.foodId)
    .then((food) => {
        if (food != null && food.comments.id(req.params.commentId)) {
            if (food.comments.id(req.params.commentId).author.toString() != req.user._id.toString()) {
                err = new Error('not authorized');
                err.status = 403;
                return next(err);
            }
            food.comments.id(req.params.commentId).remove();
            food.save()
            .then((food) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(food);
            }, (err) => next(err))
            .catch((err) => next(err));
        } else if (food == null) {
            err = new Error(req.params.foodId + ' not found');
            err.status = 404;
            return next(err);
        } else {
            err = new Error(req.params.commentId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = foodRouter;