import Header from  "./Header"
import Content from "./Content"

export default () => {
  
  return (
    <div id="container" class="text-gray-100 antialiased h-full w-full m-auto flex flex-col">
      <Header />
      <Content />
    </div>
  )
  
}