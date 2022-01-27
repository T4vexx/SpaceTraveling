import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import { FiCalendar,FiUser } from "react-icons/fi";

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}:PostProps) {
  
  return (
    <>
      <img className={styles.banner} src={post.data.banner.url} alt="banner" />
      <div className={styles.container}>
        <strong>{post.data.title}</strong>
        <div>
          <time>{post.first_publication_date}</time>
          <p>{post.data.author}</p>
          <i>4m</i>
        </div>
        {post.data.content.map(info => {
          <div key={info.heading}>
            <strong>{info.heading}</strong>
            <p>{info.body.text}</p>
          </div>
        })}
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  // const prismic = getPrismicClient();
  // const posts = await prismic.query();
  return {
    paths: [],
    fallback: 'blocking',
}
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});
  
  const content = response.data.content.map(post => {
    const texts = post.body.map((textss) => {
      return textss.text
    })
    return {
      heading: post.heading,
      body: { 
        text: texts,
      }
    }
  })

  const post = {
    first_publication_date: format(
        new Date(response.last_publication_date),
        "d MMM y",
        {
          locale: ptBR,
        }
      ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: content,
    },
  }

  return {
    props: {
      post,
    },
    revalidate: 60*60*24, // 24 horas
  }
};
