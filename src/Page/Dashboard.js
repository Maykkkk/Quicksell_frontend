import React, { useEffect, useState, useCallback } from "react";
import Card from "../Components/Card";
import Navbar from "../Components/Navbar";
import CustomSpinner from "../Components/CustomSpinner";

// Import Images
import profile from "../Assets/profile.png";
import profile1 from "../Assets/profile1.png";
import profile4 from "../Assets/profile4.jpeg";
import profile5 from "../Assets/profile5.jpeg";
import profile6 from "../Assets/profile6.png";
import profile7 from "../Assets/profile7.png";
import { FETCH_URL } from "../Config";

const Dashboard = () => {
  // State Variables
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState({});
  const [user, setUser] = useState({});
  const [priority, setPriority] = useState({});
  const [grouping, setGrouping] = useState("status");
  const [ordering, setOrdering] = useState("priority");
  const [availableUser, setAvailableUser] = useState({});
  const [statusMapping, setStatusMapping] = useState({});
  const statusKeys = ["Backlog", "Todo", "In progress", "Done", "Canceled"];

  // Fetch API function wrapped with useCallback
  const getData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(FETCH_URL);
      const data = await response.json();
      setUserData(data.users);
      setUser(groupByUser(data.tickets));
      setStatus(groupByStatus(data.tickets));
      setPriority(groupByPriority(data.tickets));
      setAvailableUser(availabilityMap(data.users));
      setStatusMapping(extractStatusMapping(data));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [ordering, grouping]);

  // Fetch Data on grouping or ordering change
  useEffect(() => {
    getData();
  }, [getData]);

  const sortByTitle = (tickets) => tickets.sort((a, b) => a.title.localeCompare(b.title));

  // Grouping functions
  const groupByStatus = (tickets) => {
    let sortedTickets = ordering === "title" ? sortByTitle(tickets) : tickets;
    const grouped = sortedTickets.reduce((acc, ticket) => {
      acc[ticket.status] = acc[ticket.status] || [];
      acc[ticket.status].push(ticket);
      return acc;
    }, {});

    statusKeys.forEach((key) => {
      if (!grouped[key]) grouped[key] = [];
    });

    if (ordering === "priority") {
      Object.values(grouped).forEach((group) => group.sort((a, b) => b.priority - a.priority));
    }

    return { Keys: statusKeys, ...grouped };
  };

  const groupByPriority = (tickets) => {
    let sortedTickets = ordering === "title" ? sortByTitle(tickets) : tickets;
    const priorityObject = sortedTickets.reduce((acc, ticket) => {
      acc[ticket.priority] = acc[ticket.priority] || [];
      acc[ticket.priority].push(ticket);
      return acc;
    }, {});
    return { Keys: Object.keys(priorityObject), ...priorityObject };
  };

  const groupByUser = (tickets) => {
    let sortedTickets = ordering === "title" ? sortByTitle(tickets) : tickets;
    const grouped = sortedTickets.reduce((acc, ticket) => {
      acc[ticket.userId] = acc[ticket.userId] || [];
      acc[ticket.userId].push(ticket);
      return acc;
    }, {});

    if (ordering === "priority") {
      Object.values(grouped).forEach((group) => group.sort((a, b) => b.priority - a.priority));
    }

    return { Keys: userData.map((user) => user.id.toString()), ...grouped };
  };

  const availabilityMap = (users) => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.available;
      return acc;
    }, {});
  };

  const extractStatusMapping = (data) => {
    return data.tickets.reduce((acc, ticket) => {
      acc[ticket.id] = ticket.status;
      return acc;
    }, {});
  };

  const renderCards = (items, commonProps) => {
    return items.map((item) => (
      <Card
        id={item.id}
        title={item.title}
        tag={item.tag}
        userId={item.userId}
        status={commonProps.status}
        userData={commonProps.userData}
        priority={item.priority}
        key={item.id}
        grouping={commonProps.grouping}
        ordering={commonProps.ordering}
        statusMapping={commonProps.statusMapping}
      />
    ));
  };

  const renderColumns = (keys, items, commonProps) => {
    return keys.map((key, index) => (
      <div className="column" key={index}>
        <div className="Header">
          <div className="icon-text">
            <i className={`bx ${getIconForStatus(key)}`} />
            <span className="text">{key === "In progress" ? "In Progress" : key}</span>
            <span>{items[key]?.length}</span>
          </div>
          <div className="actions">
            <i className="bx bx-plus" />
            <i className="bx bx-dots-horizontal-rounded" />
          </div>
        </div>
        {items[key] && renderCards(items[key], commonProps)}
      </div>
    ));
  };

  const getIconForStatus = (status) => {
    const icons = {
      Todo: "bx-circle",
      "In progress": "bx-adjust",
      Backlog: "bx-task-x",
      Done: "bxs-check-circle",
      Canceled: "bxs-x-circle",
    };
    return icons[status] || "";
  };

  const renderContent = () => {
    if (grouping === "status") {
      return isLoading ? (
        <CustomSpinner />
      ) : (
        renderColumns(status.Keys, status, { status, userData, grouping, ordering, statusMapping })
      );
    } else if (grouping === "users") {
      return isLoading ? (
        <CustomSpinner />
      ) : (
        user.Keys.map((userId, index) => {
          const currentUser = userData.find((u) => u.id.toString() === userId);
          return (
            <div className="column" key={index}>
              <div className="Header">
                <div className="icon-text">
                  <div className={availableUser[userId] ? "user-avatar" : "user-avatar-unavailable"}>
                    <img
                      src={getProfileImage(userId)}
                      className={availableUser[userId] ? "user-avatar" : "user-avatar-unavailable"}
                      alt="user"
                    />
                  </div>
                  <span className="text">{currentUser?.name || "Unknown"}</span>
                  <span>{user[userId]?.length}</span>
                </div>
                <div className="actions">
                  <i className="bx bx-plus" />
                  <i className="bx bx-dots-horizontal-rounded" />
                </div>
              </div>
              {user[userId] && renderCards(user[userId], { status, userData, grouping, ordering, statusMapping })}
            </div>
          );
        })
      );
    } else {
      return isLoading ? (
        <CustomSpinner />
      ) : (
        priority.Keys.sort((a, b) => a - b).map((item, index) => (
          <div className="column" key={index}>
            <div className="Header">
              <div className="icon-text-priority">
                <i className={`bx ${getIconForPriority(item)}`} />
                <span className="text">{getPriorityLabel(item)}</span>
                <span className="count">{priority[item]?.length}</span>
              </div>
              <div className="actions">
                <i className="bx bx-plus" />
                <i className="bx bx-dots-horizontal-rounded" />
              </div>
            </div>
            {priority[item] && renderCards(priority[item], { status, userData, grouping, ordering, statusMapping })}
          </div>
        ))
      );
    }
  };

  const getIconForPriority = (priority) => {
    const icons = {
      "0": "bx-dots-horizontal-rounded",
      "1": "bx-signal-2",
      "2": "bx-signal-3",
      "3": "bx-signal-4",
      "4": "bxs-message-square-error",
    };
    return icons[priority] || "";
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      "0": "No Priority",
      "1": "Low",
      "2": "Medium",
      "3": "High",
      "4": "Urgent",
    };
    return labels[priority] || "";
  };

  const getProfileImage = (userId) => {
    const profileImages = {
      "usr-1": profile1,
      "usr-2": profile6,
      "usr-3": profile7,
      "usr-4": profile5,
      "usr-5": profile4,
    };
    return profileImages[userId] || profile;
  };

  return (
    <div>
      <Navbar
        grouping={grouping}
        setGrouping={setGrouping}
        ordering={ordering}
        setOrdering={setOrdering}
        call={getData}
      />
      <div className="Dashboard-Container">{renderContent()}</div>
    </div>
  );
};

export default Dashboard;
