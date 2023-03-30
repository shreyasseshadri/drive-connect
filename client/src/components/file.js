import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import Tooltip from '@material-ui/core/Tooltip';
import Zoom from '@material-ui/core/Zoom';


const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1),
    marginBottom: theme.spacing(1),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  icon: {
    marginRight: theme.spacing(1),
  },
  tooltip: {
    maxWidth: 'none',
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
    textAlign: 'left',
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    borderRadius: '5px',
  },
  arrow: {
    color: theme.palette.background.paper,
  },
}));

const File = ({ file }) => {
    console.log("File!!",file.members);
  const classes = useStyles();
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  const tooltipContent = (
    <div className={classes.tooltip}>
      <Typography variant="subtitle2">Can Be Accessed by:</Typography>
      <Typography variant="caption">
        {file.members.map((member) => (
          <span>{member.displayName}<br /></span>
        ))}
      </Typography>
    </div>
  );

  return (
    <Tooltip
      title={tooltipContent}
      open={isHovered}
      enterDelay={500}
      TransitionComponent={Zoom}
      arrow
      classes={{ tooltip: classes.tooltip, arrow: classes.arrow }}
    >
      <Paper
        className={classes.root}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <InsertDriveFileIcon className={classes.icon} />
        <div>
          <Typography variant="subtitle1">{file.name}</Typography>
          <Typography variant="caption">
            {
                <a href={"http://localhost:7070/download/"+file.id}>Download</a>
            }
          </Typography>
          <br />
          <Typography variant="caption">
            Accessed by: {file.members.map(member => member.displayName).join(', ')}
          </Typography>
        </div>
      </Paper>
    </Tooltip>
  );
};

export default File;
