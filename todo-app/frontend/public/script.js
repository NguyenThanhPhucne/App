document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    document.getElementById('task-form').addEventListener('submit', addTask);
  });

  async function loadTasks() {
    try {
      const response = await fetch('https://app-umoj.vercel.app/api/tasks');
      const tasks = await response.json();
      const taskList = document.getElementById('task-list');
      taskList.innerHTML = '';
      tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.status === 'completed' ? 'completed' : '';
        li.innerHTML = `
          ${task.task_id}: ${task.description} (Due: ${new Date(task.due_date).toLocaleDateString()}) [${task.tags.join(', ')}]
          <div>
            <button onclick="toggleStatus('${task._id}', '${task.status}')">${task.status === 'pending' ? 'Complete' : 'Undo'}</button>
            <button onclick="deleteTask('${task._id}')">Delete</button>
          </div>
        `;
        taskList.appendChild(li);
      });
    } catch (error) {
      alert('Error loading tasks: ' + error.message);
    }
  }

  async function addTask(event) {
    event.preventDefault();
    const task = {
      task_id: parseInt(document.getElementById('task_id').value),
      description: document.getElementById('description').value,
      due_date: new Date(document.getElementById('due_date').value),
      tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    try {
      const response = await fetch('https://app-umoj.vercel.app/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!response.ok) throw new Error((await response.json()).error);
      document.getElementById('task-form').reset();
      loadTasks();
    } catch (error) {
      alert('Error adding task: ' + error.message);
    }
  }

  async function toggleStatus(id, status) {
    try {
      const newStatus = status === 'pending' ? 'completed' : 'pending';
      const response = await fetch(`https://app-umoj.vercel.app/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error((await response.json()).error);
      loadTasks();
    } catch (error) {
      alert('Error updating task: ' + error.message);
    }
  }

  async function deleteTask(id) {
    try {
      const response = await fetch(`https://app-umoj.vercel.app/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error((await response.json()).error);
      loadTasks();
    } catch (error) {
      alert('Error deleting task: ' + error.message);
    }
  }