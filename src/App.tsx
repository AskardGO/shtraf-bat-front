import "./App.css";
import React, {FC} from "react";
import '@chatui/core/dist/index.css'

type AppProps = {
  router?: React.ReactNode;
}

const App: FC<AppProps> = ({router}) => {
  return (
    <main className="container">
      {router}
    </main>
  );
}

export default App;
