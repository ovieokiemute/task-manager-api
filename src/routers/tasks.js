const express = require('express');
const router = new express.Router();
const Tasks = require('../models/task');
const auth = require('../middleware/auth');

router.post('/tasks', auth, async (req, res) => {
    //const task = new Tasks (req.body);
    const task = new Tasks({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save();
        res.status(201).send(task)
        
    } catch (error) {
        res.status(400).send(error)

    }

   
});










//GET /tasks/?completed=true,
//GET /tasks/?limt=2&skip=2,
//GET /tasks/?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc'? -1: 1;
        
    }

    try {
       
        //const task = await Tasks.find({owner: req.user._id});

        await req.user.populate({

            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }

        }).execPopulate()
        res.status(200).send(req.user.tasks);

    } catch (error) {
        
        res.status(400).send(error);
    }

});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Tasks.findOne({_id, owner: req.user._id}) 
        if (!task){
            return res.status(400).send('Could not find the task')
        }

        res.status(201).send(task)

    } catch (error) {
        

    }
 
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidUpdates = updates.every(update => allowedUpdates.includes(update));

    if(!isValidUpdates){
        return res.status(400).send('Invalid Updates');
    }

    try {
        const task = await Tasks.findOne({_id: req.params.id, owner: req.user._id});
        //const task = await Tasks.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});

        if(!task) {
            return res.status(404).send();
        }

        updates.forEach(update => task[update] = req.body[update]);
        await task.save()
        res.send(task)
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Tasks.findOneAndDelete({_id: req.params.id, owner: req.user._id});
        if(!task){
            return res.status(404).send();
        }
    
        res.send('Task has been removed successfully');
    } catch (error) {
        res.status(400).send()
    }
});





module.exports = router;
 
