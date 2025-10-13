import { useEffect, useState } from "react";

export default function() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((u, index) => {
            const userAtributes = []
            for(const key in u){
                userAtributes.push(<li key={`${index}-${u[key]}`}>{u[key]}</li>)
            }

            return userAtributes
          
        
        })}
      </ul>
    </div>
  );
}

