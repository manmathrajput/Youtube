const { exec } = require('child_process');
exec(`node -e "require('sadaslk-dlcore').ytmp3('https://www.youtube.com/watch?v=dQw4w9WgXcQ').then(res => console.log(JSON.stringify(res))).catch(err => console.error(err))"`, (err, stdout, stderr) => {
  console.log('stdout:', stdout);
});
